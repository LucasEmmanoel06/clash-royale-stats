// Funções Fetch
async function fetchDadosConsulta1() {
  const res = await fetch('http://localhost:3000/consulta1');
  return res.json();
}

async function fetchDadosConsulta2() {
  const res = await fetch('http://localhost:3000/consulta2');
  return res.json();
}

async function fetchDadosConsulta3() {
  const res = await fetch('http://localhost:3000/consulta3');
  return res.json();
}

// Funções Render
async function renderConsulta1() {
  const data = await fetchDadosConsulta1();
  const ctx = document.getElementById('graficoConsulta1').getContext('2d');

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Vitórias (%)', 'Derrotas (%)'],
      datasets: [{
        data: [data.victoryPercentage, data.defeatPercentage],
        backgroundColor: ['#10b981', '#ef4444'],
      }]
    },
    options: {
      responsive: true
    }
  });
}

async function renderConsulta2() {
  const decks = await fetchDadosConsulta2();
  const lista = document.getElementById('decks50win');
  lista.innerHTML = '';

  decks.forEach(deck => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>Player Tag:</strong> ${deck.playerTag}<br>
      <strong>Deck:</strong> ${deck.deck.map(card => card.name).join(', ')}<br>
      <strong>Total de Partidas:</strong> ${deck.totalBattles}<br>
      <strong>Vitórias:</strong> ${deck.wins}<br>
      <strong>Taxa de Vitória:</strong> ${deck.winRate}%<br><br>
    `;
    lista.appendChild(li);
  });
}

async function renderConsulta3() {
  try {
    const dados = await fetchDadosConsulta3();
    const lista = document.getElementById('listaPlayer');
    lista.innerHTML = '';

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>Total de Derrotas:</strong> ${dados.TotalDefeats}
    `;
    lista.appendChild(li);
  } catch (error) {
    console.error('Erro ao renderizar consulta 3:', error);
    const lista = document.getElementById('listaPlayer');
    lista.innerHTML = '<li>Erro ao carregar os dados.</li>';
  }
}

// Inicialização das renderizações
renderConsulta1();
renderConsulta2();
renderConsulta3();