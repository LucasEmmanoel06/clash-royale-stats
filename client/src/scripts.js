// Simulação de dados vindos do backend
    async function fetchDadosConsulta1() {
        return {
          vitorias: 120,
          derrotas: 80
        };
      }
  
      async function fetchDadosConsulta2() {
        return [
          ["Mega Knight", "Zap", "Log", "Goblin Barrel"],
          ["Golem", "Night Witch", "Baby Dragon", "Lumberjack"],
          ["Hog Rider", "Fireball", "Ice Spirit", "Cannon"]
        ];
      }

      async function renderConsulta3() {
        const res = await fetch('http://localhost:3000/consulta3');
        const dados = await res.json();
      
        const lista = document.getElementById('listaPlayer');
        lista.innerHTML = '';
        dados.forEach(jogador => {
          const li = document.createElement('li');
          li.textContent = `${jogador.name} - ${jogador.trophies} troféus`;
          lista.appendChild(li);
        });
      }
  
      // Renderizar gráfico da Consulta 1
      async function renderConsulta1() {
        const data = await fetchDadosConsulta1();
        const ctx = document.getElementById('graficoConsulta1').getContext('2d');
  
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Vitórias', 'Derrotas'],
            datasets: [{
              data: [data.vitorias, data.derrotas],
              backgroundColor: ['#10b981', '#ef4444'],
            }]
          },
          options: {
            responsive: true
          }
        });
      }
  
      // Renderizar decks da Consulta 2
      async function renderConsulta2() {
        const decks = await fetchDadosConsulta2();
        const lista = document.getElementById('decksVitoriosos');
        lista.innerHTML = '';
        decks.forEach(deck => {
          const li = document.createElement('li');
          li.textContent = deck.join(', ');
          lista.appendChild(li);
        });
      }
  
      // Inicialização
      renderConsulta1();
      renderConsulta2();
      renderConsulta3();