const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "clashRoyale";

// Conectar ao MongoDB uma vez quando o servidor iniciar
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1); // Encerra o servidor se não conseguir conectar
  }
}

app.get('/consulta1', async (req, res) => {
  try {
    const db = client.db(dbName);
    const BattleLog = db.collection('BattleLog');

    const resultado = await BattleLog.aggregate([
      {
        $match: {
          $or: [
            { "team.cards.name": "Mega Knight" },
            { "opponent.cards.name": "Mega Knight" }
          ]
        }
      },
      {
        $project: {
          teamCrowns: { $arrayElemAt: ["$team.crowns", 0] },
          opponentCrowns: { $arrayElemAt: ["$opponent.crowns", 0] },
          containsMegaKnight: {
            $or: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$team.cards",
                        as: "card",
                        cond: { $eq: ["$$card.name", "Mega Knight"] }
                      }
                    }
                  },
                  0
                ]
              },
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$opponent.cards",
                        as: "card",
                        cond: { $eq: ["$$card.name", "Mega Knight"] }
                      }
                    }
                  },
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          victories: {
            $sum: {
              $cond: [{ $gt: ["$teamCrowns", "$opponentCrowns"] }, 1, 0]
            }
          },
          defeats: {
            $sum: {
              $cond: [{ $lt: ["$teamCrowns", "$opponentCrowns"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          victoryPercentage: {
            $multiply: [{ $divide: ["$victories", "$totalMatches"] }, 100]
          },
          defeatPercentage: {
            $multiply: [{ $divide: ["$defeats", "$totalMatches"] }, 100]
          }
        }
      }
    ]).toArray();

    res.json(resultado[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consulta3', async (req, res) => {
  try {
    const db = client.db(dbName);
    const Player = db.collection('Player');

    const resultado = await Player.find(
      { trophies: { $gt: 7000 } },
      { projection: { name: 1, trophies: 1, _id: 0 } }
    ).toArray();

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

const PORT = 3000;
app.listen(PORT, async () => {
  await connectToDatabase(); // Conecta ao MongoDB antes de iniciar o servidor
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
