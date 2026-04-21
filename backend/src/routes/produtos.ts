import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

async function carregarImagens(conn: any, produtoId: number) {
  const [imgs] = await conn.execute(
    'SELECT id, imagem_base64, ordem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem',
    [produtoId],
  );
  return imgs;
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute<any[]>(`
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    ORDER BY p.nome
  `);
  for (const p of rows) {
    p.imagens = await carregarImagens(pool, p.id);
  }
  res.json(rows);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute<any[]>(`
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.id = ?
  `, [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'Produto não encontrado' }); return; }
  rows[0].imagens = await carregarImagens(pool, rows[0].id);
  res.json(rows[0]);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, categoria_id, descricao, dimensoes, catalogo_online, valor_base, imagens } = req.body;
  if (!nome) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [result] = await conn.execute<any>(
      'INSERT INTO produtos (nome, categoria_id, descricao, dimensoes, catalogo_online, valor_base) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, categoria_id || null, descricao || null, dimensoes || null, catalogo_online ? 1 : 0, valor_base || 0],
    );
    const produtoId = result.insertId;
    await salvarImagens(conn, produtoId, imagens);
    await conn.commit();
    const [rows] = await pool.execute<any[]>('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    rows[0].imagens = await carregarImagens(pool, produtoId);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, categoria_id, descricao, dimensoes, catalogo_online, valor_base, imagens } = req.body;
  const id = Number(req.params.id);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.execute(
      'UPDATE produtos SET nome=?, categoria_id=?, descricao=?, dimensoes=?, catalogo_online=?, valor_base=? WHERE id=?',
      [nome, categoria_id || null, descricao || null, dimensoes || null, catalogo_online ? 1 : 0, valor_base || 0, id],
    );
    if (Array.isArray(imagens)) {
      await conn.execute('DELETE FROM produto_imagens WHERE produto_id = ?', [id]);
      await salvarImagens(conn, id, imagens);
    }
    await conn.commit();
    const [rows] = await pool.execute<any[]>('SELECT * FROM produtos WHERE id = ?', [id]);
    rows[0].imagens = await carregarImagens(pool, id);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM produtos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

async function salvarImagens(conn: any, produtoId: number, imagens: any[]) {
  if (!Array.isArray(imagens)) return;
  const lista = imagens.slice(0, 3);
  for (let i = 0; i < lista.length; i++) {
    await conn.execute(
      'INSERT INTO produto_imagens (produto_id, imagem_base64, ordem) VALUES (?, ?, ?)',
      [produtoId, lista[i].imagem_base64 ?? lista[i], i],
    );
  }
}

export default router;
