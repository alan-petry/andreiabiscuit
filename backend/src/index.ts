import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import clientesRoutes from './routes/clientes';
import produtosRoutes from './routes/produtos';
import pedidosRoutes from './routes/pedidos';
import pagamentosRoutes from './routes/pagamentos';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pedidos/:pedidoId/pagamentos', pagamentosRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
