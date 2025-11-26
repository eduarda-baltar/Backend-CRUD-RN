import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

// --- CONFIGURAÇÃO DE CAMINHOS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3333; // MUDANÇA: Porta segura para evitar conflitos

// --- MIDDLEWARES (Configurações) ---
app.use(cors()); // Permite conexões do React Native
app.use(express.json()); // Entende JSON vindo do App

// --- O "RAIO-X" (Logger de Requisições) ---
// Isso vai mostrar no terminal toda vez que o App chamar
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- BANCO DE DADOS (LowDB) ---
const file = path.join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter, { items: [] }); // Valor padrão inicial

async function initDB() {
  await db.read();
  // Se o arquivo estiver vazio ou corrompido, reseta para padrão
  db.data ||= { items: [] }; 
  await db.write();
  console.log("Banco de dados carregado com sucesso!");
}

await initDB();

// --- ROTAS DA API ---

// 1. Rota de Teste (Para ver no navegador)
app.get("/", (req, res) => {
  res.send(`API rodando na porta ${PORT}. Acesse /items`);
});

// 2. Listar Itens (READ)
app.get("/items", async (req, res) => {
  await db.read();
  res.json(db.data.items);
});

// 3. Buscar um Item (READ ONE)
app.get("/items/:id", async (req, res) => {
  const { id } = req.params;
  await db.read();
  const item = db.data.items.find((i) => i.id === id);
  
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  res.json(item);
});

// 4. Criar Item (CREATE)
// 4. Criar Item (CREATE) - SUBSTITUA ESTE BLOCO INTEIRO
app.post("/items", async (req, res) => {
  const { title, description } = req.body;

  // Validação
  if (!title) {
    return res.status(400).json({ error: "O campo 'title' é obrigatório" });
  }

  // --- CORREÇÃO AQUI 👇 ---
  await db.read(); // 1. Garante que leu o arquivo mais recente
  db.data ||= { items: [] }; // 2. Se db.data for nulo, cria o objeto
  db.data.items ||= []; // 3. Se a lista items não existir, cria uma vazia
  // -----------------------

  const newItem = {
    id: nanoid(),
    title,
    description: description || "Sem descrição"
  };

  db.data.items.push(newItem); // Agora isso vai funcionar com certeza
  await db.write();

  console.log("Item criado com sucesso:", newItem);
  res.status(201).json(newItem);
});

// 5. Atualizar Item (UPDATE)
app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  await db.read();
  const index = db.data.items.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Item não encontrado para edição" });
  }

  // Atualiza apenas o que foi enviado
  db.data.items[index] = {
    ...db.data.items[index],
    title: title || db.data.items[index].title,
    description: description || db.data.items[index].description,
  };

  await db.write();
  console.log("Item atualizado:", db.data.items[index]);
  res.json(db.data.items[index]);
});

// 6. Deletar Item (DELETE)
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  
  // 1. Carrega os dados atuais
  await db.read();
  
  // 2. Garante que a lista existe para não dar erro
  db.data ||= { items: [] }; 
  
  // 3. Procura o índice do item
  const index = db.data.items.findIndex((i) => i.id === id);

  // 4. Se não achar, avisa o frontend
  if (index === -1) {
    console.log(`Tentativa de excluir ID inexistente: ${id}`);
    return res.status(404).json({ error: "Item não encontrado" });
  }

  // 5. Remove o item e salva
  const deletedItem = db.data.items.splice(index, 1);
  await db.write();

  console.log("Item excluído com sucesso ID:", id);
  res.json(deletedItem); // Retorna o item excluído
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.clear(); // Limpa o terminal para ficar bonito
  console.log("🚀 SERVIDOR RODANDO!");
  console.log(`🔗 Local:   http://localhost:${PORT}`);
  console.log(`📡 Rede:    Seu IP deve ser usado no App (use 'ipconfig')`);
  console.log("---------------------------------------------------");
});