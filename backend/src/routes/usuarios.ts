import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute('SELECT id, email, created_at FROM usuarios ORDER BY email');
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) { res.status(400).json({ error: 'Email e senha são obrigatórios' }); return; }
  const senha_hash = await bcrypt.hash(senha, 10);
  const [result] = await pool.execute<any>(
    'INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)',
    [email, senha_hash],
  );
  res.status(201).json({ id: result.insertId, email });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { email, senha } = req.body;
  if (senha) {
    const senha_hash = await bcrypt.hash(senha, 10);
    await pool.execute('UPDATE usuarios SET email=?, senha_hash=? WHERE id=?', [email, senha_hash, req.params.id]);
  } else {
    await pool.execute('UPDATE usuarios SET email=? WHERE id=?', [email, req.params.id]);
  }
  res.json({ id: req.params.id, email });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute<any[]>('SELECT COUNT(*) as total FROM usuarios', []);
  if (rows[0].total <= 1) { res.status(400).json({ error: 'Não é possível excluir o único usuário' }); return; }
  await pool.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
