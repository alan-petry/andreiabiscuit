import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM clientes ORDER BY nome');
  res.json(rows);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute<any[]>('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }
  res.json(rows[0]);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, telefone, email, observacao } = req.body;
  if (!nome) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  const [result] = await pool.execute<any>(
    'INSERT INTO clientes (nome, telefone, email, observacao) VALUES (?, ?, ?, ?)',
    [nome, telefone || null, email || null, observacao || null],
  );
  const [rows] = await pool.execute<any[]>('SELECT * FROM clientes WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, telefone, email, observacao } = req.body;
  await pool.execute(
    'UPDATE clientes SET nome=?, telefone=?, email=?, observacao=? WHERE id=?',
    [nome, telefone || null, email || null, observacao || null, req.params.id],
  );
  const [rows] = await pool.execute<any[]>('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM clientes WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
