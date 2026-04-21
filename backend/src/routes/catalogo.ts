import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const [produtos] = await pool.execute<any[]>(`
    SELECT p.id, p.nome, p.descricao, p.dimensoes, p.valor_base,
           c.nome AS categoria_nome, c.id AS categoria_id
    FROM produtos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.catalogo_online = 1
    ORDER BY c.nome, p.nome
  `);

  for (const p of produtos) {
    const [imgs] = await pool.execute<any[]>(
      'SELECT imagem_base64, ordem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem',
      [p.id],
    );
    p.imagens = imgs;
  }

  res.json(produtos);
});

export default router;
