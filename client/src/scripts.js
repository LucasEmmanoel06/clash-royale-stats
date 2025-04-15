// Funções Fetch
async function fetchDadosConsulta1() {
  const res = await fetch('https://clash-royale-stats-l691.onrender.com/consulta1');
  return res.json();
}

async function fetchDadosConsulta2() {
  const res = await fetch('https://clash-royale-stats-l691.onrender.com/consulta2');
  return res.json();
}

async function fetchDadosConsulta3() {
  const res = await fetch('https://clash-royale-stats-l691.onrender.com/consulta3');
  return res.json();
}

async function fetchDadosConsulta4() {
  const res = await fetch('https://clash-royale-stats-l691.onrender.com/consulta4');
  return res.json();
}

async function fetchDadosConsultaExtra1() {
  const res = await fetch('http://localhost:3000/consultaextra1');
  return res.json();
}

async function fetchDadosConsultaExtra3() {
  const res = await fetch('http://localhost:3000/consultaextra3');
  return res.json();
}

async function fetchDadosConsultaExtra2() {
  const res = await fetch('http://localhost:3000/consultaextra2');
  return res.json();
}

async function fetchDadosConsulta5() {
  const res = await fetch('http://localhost:3000/consulta5');
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

async function renderConsulta4() {
  try {
    const dados = await fetchDadosConsulta4(); // Busca os dados da API
    const container = document.getElementById('consulta4-container'); // Elemento onde os dados serão exibidos

    container.innerHTML = `
      <p><strong>Vitórias com Miner:</strong> ${dados.wins_with_miner_as_winner || 0}</p>
    `;
  } catch (error) {
    console.error('Erro ao renderizar consulta 4:', error);
    const container = document.getElementById('consulta4-container');
    container.innerHTML = '<p>Erro ao carregar os dados.</p>'; // Mensagem de erro
  }
}

async function renderConsultaExtra1() {
  try {
    const dados = await fetchDadosConsultaExtra1();
    const container = document.getElementById('consultaextra1-container'); // Elemento onde os dados serão exibidos

    container.innerHTML = `
      <p><strong>Total de Partidas com Witch e Giant:</strong> ${dados.totalMatches}</p>
      <p><strong>Total de Vitórias:</strong> ${dados.totalWins}</p>
      <p><strong>Taxa de Vitória:</strong> ${dados.winRate.toFixed(2)}%</p>
    `;
  } catch (error) {
    console.error('Erro ao renderizar consultaextra1:', error);
    const container = document.getElementById('consultaextra1-container');
    container.innerHTML = '<p>Erro ao carregar os dados.</p>'; // Mensagem de erro
  }
}

async function renderConsultaExtra3() {
  try {
    const dados = await fetchDadosConsultaExtra3();
    const container = document.getElementById('consultaextra3-container'); // Elemento onde os dados serão exibidos

    container.innerHTML = `
      <p><strong>Carta mais utilizada:</strong> ${dados.card}</p>
      <p><strong>Quantidade de uso:</strong> ${dados.usageCount}</p>
    `;
  } catch (error) {
    console.error('Erro ao renderizar consultaextra3:', error);
    const container = document.getElementById('consultaextra3-container');
    container.innerHTML = '<p>Erro ao carregar os dados.</p>'; // Mensagem de erro
  }
}

async function renderConsultaExtra2() {
  try {
    const dados = await fetchDadosConsultaExtra2();
    const container = document.getElementById('consultaextra2-container'); // Elemento onde os dados serão exibidos

    const deck1 = dados.deck1Stats[0] || { matches: 0, wins: 0, winRate: 0 };
    const deck2 = dados.deck2Stats[0] || { matches: 0, wins: 0, winRate: 0 };

    container.innerHTML = `
      <h3 class="text-lg font-semibold">Deck 1: Giant + Witch</h3>
      <p><strong>Total de Partidas:</strong> ${deck1.matches}</p>
      <p><strong>Total de Vitórias:</strong> ${deck1.wins}</p>
      <p><strong>Taxa de Vitória:</strong> ${deck1.winRate.toFixed(2)}%</p>
      <br>
      <h3 class="text-lg font-semibold">Deck 2: Miner + Wall Breakers</h3>
      <p><strong>Total de Partidas:</strong> ${deck2.matches}</p>
      <p><strong>Total de Vitórias:</strong> ${deck2.wins}</p>
      <p><strong>Taxa de Vitória:</strong> ${deck2.winRate.toFixed(2)}%</p>
    `;
  } catch (error) {
    console.error('Erro ao renderizar consultaextra2:', error);
    const container = document.getElementById('consultaextra2-container');
    container.innerHTML = '<p>Erro ao carregar os dados.</p>'; // Mensagem de erro
  }
}

async function renderConsulta5() {
  try {
    const dados = await fetchDadosConsulta5();
    const container = document.getElementById('consulta5-container'); // Elemento onde os dados serão exibidos

    container.innerHTML = ''; // Limpa o container antes de renderizar

    if (dados.length === 0) {
      container.innerHTML = '<p>Nenhum combo de cartas encontrado com mais de 55% de vitórias.</p>';
      return;
    }

    dados.forEach(combo => {
      const comboElement = document.createElement('div');
      comboElement.classList.add('mb-4');
      comboElement.innerHTML = `
        <p><strong>Combo:</strong> ${combo.combo.join(' + ')}</p>
        <p><strong>Total de Partidas:</strong> ${combo.matches}</p>
        <p><strong>Total de Vitórias:</strong> ${combo.wins}</p>
        <p><strong>Taxa de Vitória:</strong> ${combo.winRate.toFixed(2)}%</p>
      `;
      container.appendChild(comboElement);
    });
  } catch (error) {
    console.error('Erro ao renderizar consulta 5:', error);
    const container = document.getElementById('consulta5-container');
    container.innerHTML = '<p>Erro ao carregar os dados.</p>'; // Mensagem de erro
  }
}

// Inicialização das renderizações
renderConsulta1();
renderConsulta2();
renderConsulta3();
renderConsulta4();
renderConsultaExtra1();
renderConsultaExtra3();
renderConsultaExtra2();
renderConsulta5();