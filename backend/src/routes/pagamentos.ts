import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(
    'SELECT * FROM pagamentos WHERE pedido_id = ? ORDER BY data_pagamento',
    [req.params.pedidoId],
  );
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { valor, data_pagamento, tipo, observacao } = req.body;
  if (!valor || !data_pagamento) {
    res.status(400).json({ error: 'valor e data_pagamento são obrigatórios' });
    return;
  }
  const [result] = await pool.execute<any>(
    'INSERT INTO pagamentos (pedido_id, valor, data_pagamento, tipo, observacao) VALUES (?, ?, ?, ?, ?)',
    [req.params.pedidoId, valor, data_pagamento, tipo || 'outros', observacao || null],
  );
  const [rows] = await pool.execute<any[]>('SELECT * FROM pagamentos WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM pagamentos WHERE id = ? AND pedido_id = ?', [req.params.id, req.params.pedidoId]);
  res.status(204).send();
});

export default router;
