import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/connection';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }
  const [rows] = await pool.execute<any[]>('SELECT * FROM usuarios WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  res.json({ token });
});

export default router;
