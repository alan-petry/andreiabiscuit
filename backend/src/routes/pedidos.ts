import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, cliente_id, data_inicio, data_fim } = req.query;

  let sql = `
    SELECT p.*, c.nome AS cliente_nome,
      COALESCE(SUM(pg.valor), 0) AS total_pago
    FROM pedidos p
    JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN pagamentos pg ON pg.pedido_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (cliente_id) { sql += ' AND p.cliente_id = ?'; params.push(cliente_id); }
  if (data_inicio) { sql += ' AND p.data_pedido >= ?'; params.push(data_inicio); }
  if (data_fim) { sql += ' AND p.data_pedido <= ?'; params.push(data_fim); }
  sql += ' GROUP BY p.id ORDER BY p.data_pedido DESC';

  let [rows] = await pool.execute<any[]>(sql, params);

  if (status) {
    rows = rows.filter((p) => {
      const derivado = derivarStatus(p.status_itens);
      return derivado === status;
    });
  }

  res.json(rows);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const [pedidos] = await pool.execute<any[]>(
    `SELECT p.*, c.nome AS cliente_nome,
      COALESCE(SUM(pg.valor), 0) AS total_pago
     FROM pedidos p
     JOIN clientes c ON c.id = p.cliente_id
     LEFT JOIN pagamentos pg ON pg.pedido_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`,
    [req.params.id],
  );
  if (!pedidos[0]) { res.status(404).json({ error: 'Pedido não encontrado' }); return; }

  const [itens] = await pool.execute<any[]>(
    `SELECT i.*, pr.nome AS produto_nome FROM itens_pedido i
     LEFT JOIN produtos pr ON pr.id = i.produto_id
     WHERE i.pedido_id = ? ORDER BY i.id`,
    [req.params.id],
  );

  for (const item of itens) {
    const [imgs] = await pool.execute<any[]>(
      'SELECT id, imagem_base64, ordem FROM item_imagens WHERE item_pedido_id = ? ORDER BY ordem',
      [item.id],
    );
    item.imagens = imgs;
  }

  const [pagamentos] = await pool.execute<any[]>(
    'SELECT * FROM pagamentos WHERE pedido_id = ? ORDER BY data_pagamento',
    [req.params.id],
  );

  res.json({ ...pedidos[0], itens, pagamentos });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { cliente_id, data_pedido, valor_total, forma_pagamento, observacao, itens } = req.body;
  if (!cliente_id || !data_pedido) {
    res.status(400).json({ error: 'cliente_id e data_pedido são obrigatórios' });
    return;
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [result] = await conn.execute<any>(
      'INSERT INTO pedidos (cliente_id, data_pedido, valor_total, forma_pagamento, observacao) VALUES (?, ?, ?, ?, ?)',
      [cliente_id, data_pedido, valor_total || 0, forma_pagamento || 'total_entrega', observacao || null],
    );
    const pedidoId = result.insertId;

    for (const item of (itens || [])) {
      const [itemResult] = await conn.execute<any>(
        `INSERT INTO itens_pedido
          (pedido_id, produto_id, descricao_personalizacao, observacao, valor, status, previsao_entrega, data_entrega)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.produto_id || null,
          item.descricao_personalizacao || null,
          item.observacao || null,
          item.valor || 0,
          item.status || 'pendente',
          item.previsao_entrega || null,
          item.data_entrega || null,
        ],
      );

      const imagens: any[] = (item.imagens || []).slice(0, 3);
      for (let i = 0; i < imagens.length; i++) {
        await conn.execute(
          'INSERT INTO item_imagens (item_pedido_id, imagem_base64, ordem) VALUES (?, ?, ?)',
          [itemResult.insertId, imagens[i].imagem_base64, i],
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: pedidoId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { cliente_id, data_pedido, valor_total, forma_pagamento, observacao, itens } = req.body;
  const pedidoId = Number(req.params.id);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.execute(
      'UPDATE pedidos SET cliente_id=?, data_pedido=?, valor_total=?, forma_pagamento=?, observacao=? WHERE id=?',
      [cliente_id, data_pedido, valor_total || 0, forma_pagamento || 'total_entrega', observacao || null, pedidoId],
    );

    if (Array.isArray(itens)) {
      const [existentes] = await conn.execute<any[]>('SELECT id FROM itens_pedido WHERE pedido_id = ?', [pedidoId]);
      const idsEnviados = itens.filter((i) => i.id).map((i) => i.id);
      const idsRemover = existentes.map((e) => e.id).filter((id) => !idsEnviados.includes(id));
      if (idsRemover.length) {
        await conn.execute(`DELETE FROM itens_pedido WHERE id IN (${idsRemover.map(() => '?').join(',')})`, idsRemover);
      }

      for (const item of itens) {
        let itemId = item.id;
        if (itemId) {
          await conn.execute(
            `UPDATE itens_pedido SET produto_id=?, descricao_personalizacao=?, observacao=?, valor=?,
              status=?, previsao_entrega=?, data_entrega=? WHERE id=?`,
            [
              item.produto_id || null, item.descricao_personalizacao || null, item.observacao || null,
              item.valor || 0, item.status || 'pendente', item.previsao_entrega || null,
              item.data_entrega || null, itemId,
            ],
          );
        } else {
          const [r] = await conn.execute<any>(
            `INSERT INTO itens_pedido (pedido_id, produto_id, descricao_personalizacao, observacao, valor, status, previsao_entrega, data_entrega)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [pedidoId, item.produto_id || null, item.descricao_personalizacao || null, item.observacao || null,
              item.valor || 0, item.status || 'pendente', item.previsao_entrega || null, item.data_entrega || null],
          );
          itemId = r.insertId;
        }

        if (Array.isArray(item.imagens)) {
          await conn.execute('DELETE FROM item_imagens WHERE item_pedido_id = ?', [itemId]);
          const imagens = item.imagens.slice(0, 3);
          for (let i = 0; i < imagens.length; i++) {
            await conn.execute(
              'INSERT INTO item_imagens (item_pedido_id, imagem_base64, ordem) VALUES (?, ?, ?)',
              [itemId, imagens[i].imagem_base64, i],
            );
          }
        }
      }
    }

    await conn.commit();
    res.json({ id: pedidoId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM pedidos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

function derivarStatus(itens: any[]) {
  if (!itens?.length) return 'pendente';
  const statuses = itens.map((i: any) => i.status);
  if (statuses.every((s) => s === 'entregue')) return 'entregue';
  if (statuses.every((s) => s === 'cancelado')) return 'cancelado';
  if (statuses.some((s) => s === 'entregue')) return 'parcialmente_entregue';
  if (statuses.some((s) => s === 'pronto')) return 'pronto';
  if (statuses.some((s) => s === 'em_producao')) return 'em_producao';
  return 'pendente';
}

export default router;
