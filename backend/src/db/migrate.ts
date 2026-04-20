import { pool } from './connection';

const migrations = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_base DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    data_pedido DATE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    forma_pagamento ENUM('entrada_50','total_pedido','total_entrega') NOT NULL DEFAULT 'total_entrega',
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
  )`,

  `CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    tipo ENUM('entrada','final','outros') NOT NULL DEFAULT 'outros',
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT,
    descricao_personalizacao TEXT,
    observacao TEXT,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('pendente','em_producao','pronto','entregue','cancelado') NOT NULL DEFAULT 'pendente',
    previsao_entrega DATE,
    data_entrega DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS item_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_pedido_id INT NOT NULL,
    imagem_base64 MEDIUMTEXT NOT NULL,
    ordem TINYINT NOT NULL DEFAULT 0,
    FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id) ON DELETE CASCADE
  )`,
];

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Executando migrations...');
    for (const sql of migrations) {
      await conn.execute(sql);
    }
    console.log('Migrations concluídas.');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro nas migrations:', err);
  process.exit(1);
});
