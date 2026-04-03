# Knight's Tour

Aplicação em JavaScript para explorar o problema do Knight's Tour com algoritmo genético. O objetivo é encontrar um percurso em que o cavalo visite o maior número possível de casas do tabuleiro, respeitando o movimento em “L” do xadrez.

O projeto inclui uma interface visual para acompanhar a evolução, ajustar parâmetros da busca, observar o tabuleiro em tempo real e controlar a animação da solução encontrada.

## Como funciona

O algoritmo trabalha com uma população de cromossomos, onde cada cromossomo representa uma sequência de posições do tabuleiro. Cada sequência é avaliada com base na quantidade de movimentos válidos do cavalo.

Em cada geração o sistema:

1. Inicializa ou mantém a população atual.
2. Ordena os indivíduos pelo fitness.
3. Aplica cruzamento entre pais para gerar novos cromossomos.
4. Executa mutações para explorar novas combinações.
5. Remove indivíduos fora das regras de vida útil, quando essa opção está ativa.
6. Atualiza as estatísticas na interface e segue até atingir o limite de gerações ou encontrar um percurso completo.

O comportamento da busca varia conforme a opção escolhida:

- Elitista: prioriza os melhores indivíduos já classificados.
- Roleta: faz uma seleção mais aleatória, favorecendo diversidade na população.

## Interface

A tela principal foi organizada para facilitar o acompanhamento da busca:

- Configurações: define gerações, quantidade de cromossomos, taxas de seleção, cruzamento e mutação.
- Percurso do cavalo: mostra o tabuleiro, o cavalo animado e os controles de reprodução.
- Resultados e estatísticas: exibe geração atual, fitness, média e casas visitadas.
- Caminho da solução: lista o percurso encontrado durante a animação.

Os controles do percurso permitem ajustar a velocidade, pausar, avançar e retroceder a animação.

## Parâmetros principais

- Gerações: quantidade máxima de iterações da evolução.
- Cromossomos: tamanho da população inicial.
- Seleção: porcentagem da população mantida após a ordenação.
- Cruzamento: fração de indivíduos usados para gerar filhos.
- Mutação: porcentagem de indivíduos que sofrem alterações.
- Séries mutação: quantidade de trocas feitas por indivíduo mutado.
- Expectativa de vida: tempo de permanência dos indivíduos, quando a regra está ativa.

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor local:

```bash
npm run start
```

3. Abra o endereço informado pelo servidor no navegador.

## Estrutura do projeto

- `index.html`: interface principal da aplicação.
- `style.css`: estilos do tabuleiro, painel de controle e estatísticas.
- `src/index.js`: orquestra a interface, animação e interação com o algoritmo.
- `src/controller/GenerationController.js`: implementa a lógica do algoritmo genético.
- `src/model/Cromossomo.js`: representa cada indivíduo da população.

## Observações

- A opção de roleta usada no projeto é uma seleção aleatória simples entre os indivíduos disponíveis.
- O melhor caminho encontrado pode não ser uma solução completa de 64 casas, mas a interface mostra claramente até onde a busca conseguiu avançar.
- A solução visualizada é atualizada em tempo real durante a animação.
   
