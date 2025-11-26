import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3333; 


app.use(cors()); 
app.use(express.json()); 



app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});


const file = path.join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter, { items: [] }); 

async function initDB() {
  await db.read();
  
  db.data ||= { items: [] }; 
  await db.write();
  console.log("Banco de dados carregado com sucesso!");
}

await initDB();

-


app.get("/", (req, res) => {
  res.send(`API rodando na porta ${PORT}. Acesse /items`);
});


app.get("/items", async (req, res) => {
  await db.read();
  res.json(db.data.items);
});


app.get("/items/:id", async (req, res) => {
  const { id } = req.params;
  await db.read();
  const item = db.data.items.find((i) => i.id === id);
  
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  res.json(item);
});


app.post("/items", async (req, res) => {
  const { title, description } = req.body;


  if (!title) {
    return res.status(400).json({ error: "O campo 'title' é obrigatório" });
  }


  await db.read();
  db.data ||= { items: [] }; 
  db.data.items ||= [];


  const newItem = {
    id: nanoid(),
    title,
    description: description || "Sem descrição"
  };

  db.data.items.push(newItem);
  await db.write();

  console.log("Item criado com sucesso:", newItem);
  res.status(201).json(newItem);
});


app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  await db.read();
  const index = db.data.items.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Item não encontrado para edição" });
  }


  db.data.items[index] = {
    ...db.data.items[index],
    title: title || db.data.items[index].title,
    description: description || db.data.items[index].description,
  };

  await db.write();
  console.log("Item atualizado:", db.data.items[index]);
  res.json(db.data.items[index]);
});


app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  

  await db.read();
  
 
  db.data ||= { items: [] }; 
  
 
  const index = db.data.items.findIndex((i) => i.id === id);


  if (index === -1) {
    console.log(`Tentativa de excluir ID inexistente: ${id}`);
    return res.status(404).json({ error: "Item não encontrado" });
  }


  const deletedItem = db.data.items.splice(index, 1);
  await db.write();

  console.log("Item excluído com sucesso ID:", id);
  res.json(deletedItem); 
});

--
app.listen(PORT, () => {
  console.clear();
  console.log("SERVIDOR RODANDO!");
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(` Rede:    Seu IP deve ser usado no App (use 'ipconfig')`);
  console.log("---------------------------------------------------");
});