const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "clashRoyale";

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  }
}

// Finalizada
app.get('/consulta1', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
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

app.get('/consulta2', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      {
        $match: {
          "battleTime": {
            $gte: "20250410T000000.000Z", // Dia 10 às 00:00:00
            $lte: "20250412T235959.999Z"  // Dia 12 às 23:59:59.999
          }
        }
      },
      {
        $unwind: "$team"
      },
      {
        $project: {
          playerTag: "$team.tag",
          deck: "$team.cards",
          victory: {
            $gt: ["$team.crowns", 0]
          },
          battleTime: 1
        }
      },
      {
        $group: {
          _id: {
            playerTag: "$playerTag",
            deck: {
              $map: {
                input: "$deck",
                as: "card",
                in: {
                  name: "$$card.name",
                  id: "$$card.id"
                }
              }
            }
          },
          battles: { $sum: 1 },
          wins: { $sum: { $cond: ["$victory", 1, 0] } },
          lastBattleTime: { $max: "$battleTime" }
        }
      },
      {
        $addFields: {
          winRate: {
            $divide: ["$wins", "$battles"]
          }
        }
      },
      {
        $match: {
          "battles": { $gte: 3 },
          "winRate": { $gt: 0.4 }
        }
      },
      {
        $sort: {
          "winRate": -1
        }
      },
      {
        $project: {
          _id: 0,
          playerTag: "$_id.playerTag",
          deck: "$_id.deck",
          totalBattles: "$battles",
          wins: 1,
          winRate: {
            $round: [
              { $multiply: ["$winRate", 100] },
              2
            ]
          },
          lastUsed: "$lastBattleTime"
        }
      }
    ]).toArray();

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consulta3', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      {
        $match: {
          $or: [
            {
              "team.cards": {
                $all: [
                  {
                    $elemMatch: {
                      name: "Witch"
                    }
                  },
                  {
                    $elemMatch: {
                      name: "Mini P.E.K.K.A"
                    }
                  }
                ]
              }
            },
            {
              "opponent.cards": {
                $all: [
                  {
                    $elemMatch: {
                      name: "Witch"
                    }
                  },
                  {
                    $elemMatch: {
                      name: "Mini P.E.K.K.A"
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        $project: {
          teamDefeats: {
            $cond: {
              if: {
                $lt: [
                  { $arrayElemAt: ["$team.crowns", 0] },
                  { $arrayElemAt: ["$opponent.crowns", 0] }
                ]
              },
              then: 1,
              else: 0
            }
          },
          opponentDefeats: {
            $cond: {
              if: {
                $lt: [
                  { $arrayElemAt: ["$opponent.crowns", 0] },
                  { $arrayElemAt: ["$team.crowns", 0] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTeamDefeats: { $sum: "$teamDefeats" },
          totalOpponentDefeats: { $sum: "$opponentDefeats" }
        }
      },
      {
        $addFields: {
          TotalDefeats: { $add: ["$totalTeamDefeats", "$totalOpponentDefeats"] }
        }
      }
    ]).toArray();

    res.json(resultado[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/test-connection', (req, res) => {
  res.json({ message: 'Conexão bem-sucedida!' });
});

const PORT = 3000;
app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
