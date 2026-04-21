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

  `CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // colunas adicionadas individualmente — compatível com MySQL 5.7+
  `ALTER TABLE produtos ADD COLUMN categoria_id INT AFTER nome`,
  `ALTER TABLE produtos ADD COLUMN dimensoes VARCHAR(255) AFTER descricao`,
  `ALTER TABLE produtos ADD COLUMN catalogo_online TINYINT(1) NOT NULL DEFAULT 0 AFTER dimensoes`,
  `ALTER TABLE produtos ADD CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL`,

  `CREATE TABLE IF NOT EXISTS produto_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    imagem_base64 MEDIUMTEXT NOT NULL,
    ordem TINYINT NOT NULL DEFAULT 0,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
  )`,
];

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Executando migrations...');
    for (const sql of migrations) {
      try {
        await conn.execute(sql);
      } catch (err: any) {
        // ignora coluna/constraint duplicada ou tabela já existente
        if ([1060, 1061, 1062, 1050, 1826].includes(err.errno)) {
          console.log(`  ignorado (já existe): ${err.sqlMessage}`);
        } else {
          throw err;
        }
      }
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
