import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM categorias ORDER BY nome');
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome } = req.body;
  if (!nome) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  const [result] = await pool.execute<any>('INSERT INTO categorias (nome) VALUES (?)', [nome]);
  const [rows] = await pool.execute<any[]>('SELECT * FROM categorias WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome } = req.body;
  await pool.execute('UPDATE categorias SET nome=? WHERE id=?', [nome, req.params.id]);
  const [rows] = await pool.execute<any[]>('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await pool.execute('DELETE FROM categorias WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
