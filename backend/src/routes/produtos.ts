import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM produtos ORDER BY nome');
  res.json(rows);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute<any[]>('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'Produto não encontrado' }); return; }
  res.json(rows[0]);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, descricao, valor_base } = req.body;
  if (!nome) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  const [result] = await pool.execute<any>(
    'INSERT INTO produtos (nome, descricao, valor_base) VALUES (?, ?, ?)',
    [nome, descricao || null, valor_base || 0],
  );
  const [rows] = await pool.execute<any[]>('SELECT * FROM produtos WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, descricao, valor_base } = req.body;
  await pool.execute(
    'UPDATE produtos SET nome=?, descricao=?, valor_base=? WHERE id=?',
    [nome, descricao || null, valor_base || 0, req.params.id],
  );
  const [rows] = await pool.execute<any[]>('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM produtos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
