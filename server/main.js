// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "clashRoyale";

app.get('/consulta3', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const Player = db.collection('Player');

    // Retorna os campos "name" e "trophies" dos jogadores com mais de 7000 troféus
    const resultado = await Player.find(
      { trophies: { $gt: 7000 } },
      { projection: { name: 1, trophies: 1, _id: 0 } }
    ).toArray();

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  } finally {
    await client.close(); // Fecha a conexão com o banco
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
