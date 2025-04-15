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

app.get('/consulta4', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      {
        $set: {
          winner: {
            $cond: {
              if: {
                $gt: [
                  {
                    $arrayElemAt: ["$team.crowns", 0]
                  },
                  {
                    $arrayElemAt: [
                      "$opponent.crowns",
                      0
                    ]
                  }
                ]
              },
              then: "$team",
              else: "$opponent"
            }
          },
          loser: {
            $cond: {
              if: {
                $gt: [
                  {
                    $arrayElemAt: ["$team.crowns", 0]
                  },
                  {
                    $arrayElemAt: [
                      "$opponent.crowns",
                      0
                    ]
                  }
                ]
              },
              then: "$opponent",
              else: "$team"
            }
          }
        }
      },
      {
        $match: {
          "winner.cards.name": "Miner"
        }
      },
      {
        $match: {
          $expr: {
            $lt: [
              {
                $arrayElemAt: [
                  "$winner.startingTrophies",
                  0
                ]
              },
              {
                $arrayElemAt: [
                  "$loser.startingTrophies",
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $count: "wins_with_miner_as_winner"
      }
    ]).toArray();

    res.json(resultado[0] || { victoriesWithMiner: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consultaextra1', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      { $unwind: "$team" },
      { $unwind: "$opponent" }, // Garante que o oponente seja tratado corretamente
      {
        $project: {
          teamCards: "$team.cards.name",
          teamCrowns: "$team.crowns",
          opponentCrowns: "$opponent.crowns"
        }
      },
      {
        $addFields: {
          hasBoth: {
            $eq: [
              { $size: { $setIntersection: [["Witch", "Giant"], "$teamCards"] } },
              2
            ]
          },
          isWin: { $gt: ["$teamCrowns", "$opponentCrowns"] }
        }
      },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: { $cond: ["$hasBoth", 1, 0] } },
          totalWins: { $sum: { $cond: [{ $and: ["$hasBoth", "$isWin"] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalMatches: 1,
          totalWins: 1,
          winRate: {
            $cond: [
              { $eq: ["$totalMatches", 0] },
              0,
              { $multiply: [{ $divide: ["$totalWins", "$totalMatches"] }, 100] }
            ]
          }
        }
      }
    ]).toArray();

    res.json(resultado[0] || { totalMatches: 0, totalWins: 0, winRate: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consultaextra2', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      { $unwind: "$team" },
      {
        $project: {
          teamCards: "$team.cards.name",
          crowns: "$team.crowns",
          opponentCrowns: { $arrayElemAt: ["$opponent.crowns", 0] }
        }
      },
      {
        $facet: {
          deck1Stats: [
            {
              $match: {
                teamCards: { $all: ["Giant", "Witch"] }
              }
            },
            {
              $group: {
                _id: null,
                matches: { $sum: 1 },
                wins: {
                  $sum: {
                    $cond: [{ $gt: ["$crowns", "$opponentCrowns"] }, 1, 0]
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                matches: 1,
                wins: 1,
                winRate: {
                  $cond: [
                    { $eq: ["$matches", 0] },
                    0,
                    { $multiply: [{ $divide: ["$wins", "$matches"] }, 100] }
                  ]
                }
              }
            }
          ],
          deck2Stats: [
            {
              $match: {
                teamCards: { $all: ["Miner", "Wall Breakers"] }
              }
            },
            {
              $group: {
                _id: null,
                matches: { $sum: 1 },
                wins: {
                  $sum: {
                    $cond: [{ $gt: ["$crowns", "$opponentCrowns"] }, 1, 0]
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                matches: 1,
                wins: 1,
                winRate: {
                  $cond: [
                    { $eq: ["$matches", 0] },
                    0,
                    { $multiply: [{ $divide: ["$wins", "$matches"] }, 100] }
                  ]
                }
              }
            }
          ]
        }
      }
    ]).toArray();

    res.json(resultado[0] || { deck1Stats: [], deck2Stats: [] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consultaextra3', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      { $unwind: "$team" },
      { $unwind: "$team.cards" },
      {
        $group: {
          _id: "$team.cards.name",
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          card: "$_id",
          usageCount: 1
        }
      }
    ]).toArray();

    res.json(resultado[0] || { card: "Nenhuma carta encontrada", usageCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get('/consulta5', async (req, res) => {
  try {
    const db = client.db(dbName);
    const playerbattles = db.collection('playerbattles');

    const resultado = await playerbattles.aggregate([
      { $unwind: "$team" },
      {
        $project: {
          teamCards: "$team.cards.name",
          crowns: "$team.crowns",
          opponentCrowns: { $arrayElemAt: ["$opponent.crowns", 0] }
        }
      },
      {
        $project: {
          combos: {
            $reduce: {
              input: { $range: [0, { $size: "$teamCards" }] },
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: { $range: [{ $add: ["$$this", 1] }, { $size: "$teamCards" }] },
                      as: "j",
                      in: [
                        { $arrayElemAt: ["$teamCards", "$$this"] },
                        { $arrayElemAt: ["$teamCards", "$$j"] }
                      ]
                    }
                  }
                ]
              }
            }
          },
          isWin: { $gt: ["$crowns", "$opponentCrowns"] }
        }
      },
      { $unwind: "$combos" },
      {
        $project: {
          combo: {
            $cond: {
              if: { $lt: [{ $arrayElemAt: ["$combos", 0] }, { $arrayElemAt: ["$combos", 1] }] },
              then: "$combos",
              else: [{ $arrayElemAt: ["$combos", 1] }, { $arrayElemAt: ["$combos", 0] }]
            }
          },
          isWin: 1
        }
      },
      {
        $group: {
          _id: "$combo",
          matches: { $sum: 1 },
          wins: {
            $sum: { $cond: ["$isWin", 1, 0] }
          }
        }
      },
      {
        $project: {
          combo: "$_id",
          matches: 1,
          wins: 1,
          winRate: {
            $multiply: [{ $divide: ["$wins", "$matches"] }, 100]
          }
        }
      },
      {
        $match: {
          winRate: { $gt: 55 }
        }
      },
      { $sort: { winRate: -1 } },
      { $limit: 3 }
    ]).toArray();

    res.json(resultado);
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
