# Cypress + TypeScript · ServeRest

[![Testes](https://github.com/GuiNunesBR/cypress-serverest-e2e/actions/workflows/tests.yml/badge.svg)](https://github.com/GuiNunesBR/cypress-serverest-e2e/actions/workflows/tests.yml)

Suíte de automação **E2E (interface) e de API** em **Cypress + TypeScript** contra o [ServeRest](https://serverest.dev), uma loja virtual pública criada para estudo de testes.

É a versão Cypress do [playwright-serverest-e2e](https://github.com/GuiNunesBR/playwright-serverest-e2e): **mesmos cenários, mesmos dados, mesmos contratos**, para comparar as duas ferramentas lado a lado. O comparativo está no fim deste arquivo.

## O que é testado

| Camada | Cobertura |
|---|---|
| **API** | usuários (cadastro, duplicidade, campos obrigatórios, consulta, exclusão), login (válido, senha errada, e-mail inexistente), produtos (CRUD, token, duplicidade, preço inválido, filtro), carrinho e conclusão de compra |
| **UI · admin** | login (sucesso, erro e logout), cadastro de usuário pela tela pública e pelo painel, cadastro e exclusão de produto |
| **UI · cliente** | busca de produto na loja e montagem da lista de compras (quantidade e preço) |
| **Acessibilidade** | 9 telas auditadas com axe-core (WCAG 2.1 A e AA), com linha de base das pendências conhecidas |
| **Contrato** | toda resposta relevante da API é validada com schemas [Zod](https://zod.dev) |

São **36 testes** (18 de API, 9 de UI e 9 de acessibilidade). Os cenários mais importantes levam a tag `@smoke` (`npm run test:smoke`) e os de acessibilidade, `@a11y` (`npm run test:a11y`).

## Como rodar

Requisitos: Node 22 ou superior.

```bash
npm ci
npx cypress install   # baixa o binário do Cypress, se o npm não tiver baixado
npm test              # tudo (API + UI), com relatório em cypress/reports/html
npm run test:api      # só API
npm run test:ui       # só interface
npm run test:smoke    # só os cenários @smoke
npm run test:a11y     # só acessibilidade
npm run open          # modo interativo
```

Para apontar para outro ambiente, copie `.env.example` para `.env` e ajuste `FRONT_URL` e `API_URL`.

## Evidências no relatório

O relatório é gerado com [cypress-mochawesome-reporter](https://github.com/LironEr/cypress-mochawesome-reporter) em um único HTML (prints embutidos):

- **Chamadas de API.** Toda chamada feita pelo teste entra no contexto do teste (`API POST /usuarios → 201`) com requisição e resposta em JSON.
- **Respostas recebidas pelo front.** Nos testes de UI, a chamada que a tela dispara é interceptada com `cy.intercept` (`Front DELETE /produtos/:id → 200`), anexada e validada com o mesmo schema Zod dos testes de API.
- **Prints.** Cada cenário de UI tira prints da tela inteira nos pontos-chave; em caso de falha, entra também o print do momento do erro.
- **Confirmação no backend.** Depois da ação na tela, o teste consulta a API para conferir que o dado foi gravado (ou removido) de verdade.

## Acessibilidade

As 9 telas do front (públicas, painel do admin e loja do cliente) passam pelo [axe-core](https://github.com/dequelabs/axe-core) com os critérios **WCAG 2.1 A e AA**. A lista de páginas e a linha de base são as mesmas nos projetos Playwright e Cypress.

O front já tem violações hoje, então o teste não exige zero: cada página tem uma **linha de base** com as regras já conhecidas, e o teste **falha se aparecer uma regra nova**. O resultado completo do axe (regra, impacto, elementos afetados e link de referência) fica anexado a cada teste no relatório.

Pendências conhecidas do ServeRest:

| Regra | Impacto | Onde | O que é |
|---|---|---|---|
| `image-alt` | crítico | todas as telas | imagens (logo e fotos de produto) sem texto alternativo |
| `color-contrast` | sério | todas as telas | textos e botões abaixo do contraste mínimo de 4.5:1 |
| `link-name` | sério | vitrine do cliente (`/home`) | o link de cada produto envolve só a imagem sem `alt`, então fica sem nome para leitores de tela |

O `cypress-axe` ainda não declara suporte ao Cypress 16, então o `axe-core` é injetado direto na página (`cypress/support/a11y/axe.ts`).

## Estrutura

```
cypress/
  e2e/
    api/          testes de API
    ui/           testes de interface
  support/
    a11y/         páginas auditadas, linha de base e análise com axe
    api/          cliente da API (um método por endpoint) e schemas Zod
    data/         fábricas de dados únicos (faker)
    pages/        Page Objects da interface
    evidencias.ts captura da resposta do front e prints
    limpeza.ts    registro do que o teste criou, apagado no afterEach
    sessao.ts     criação de admin/cliente e login com cy.session
    e2e.ts        registro do reporter, do grep e da limpeza global
.github/workflows/tests.yml   CI (GitHub Actions) com relatório no GitHub Pages
```

## Decisões de projeto

- **Dados isolados e únicos.** Cada teste cria seus próprios dados com sufixo único, porque o ServeRest é compartilhado.
- **Limpeza garantida.** O teste registra o que criou em `limpeza`, e um `afterEach` global apaga tudo, mesmo quando o teste falha. O que nasce pela interface é localizado no final pelo e-mail ou pelo nome.
- **Sessão reaproveitada.** Nos specs do admin, um usuário é criado no `before`, entra pela tela uma vez com `cy.session` e é removido no `after`.
- **Funções em vez de comandos customizados.** Cliente de API, captura e evidências são funções TypeScript importadas, sem `Cypress.Commands.add`: tipagem direta e sem declarações globais.
- **CI.** Checagem de tipos, execução completa, relatório como artefato e publicação no GitHub Pages na branch `main`.

## Observações sobre o alvo

- O `data-testid` do botão de cadastrar produto no front é `cadastarProdutos` (sem o "r"). Foi mantido como está.
- O botão "Adicionar no carrinho" da lista de compras não chama a API: leva a uma tela "Em construção". Por isso o fluxo do cliente vai até a lista de compras.
- A saudação da home do admin é renderizada como `Bem Vindo  <nome>`, com espaço duplo.
- Bug real encontrado por esta suíte: em 16/11/2026 o cadastro de produto pela tela passou a receber 400. O ServeRest 3.4.0 ([ServeRest#571](https://github.com/ServeRest/ServeRest/pull/571)) fez a API recusar `preco` e `quantidade` em texto, e o front ainda enviava texto. O teste ficou pulado com o link da correção, proposta e aceita em [ServeRest/front#42](https://github.com/ServeRest/front/pull/42), e voltou a rodar depois que ela foi publicada.

## Comparativo: Cypress × Playwright

Mesmos 27 cenários funcionais, mesma máquina (Windows, Chromium/Electron), contra o ServeRest público. Os tempos variam com a rede e servem como ordem de grandeza, não como benchmark.

| | Playwright | Cypress |
|---|---|---|
| **Tempo total (parede)** | ~56 s em paralelo · ~96 s com 1 worker | ~4 min (specs em sequência) |
| **Paralelismo** | nativo, por worker, sem custo | sem paralelismo local; no CI só com várias máquinas ou Cypress Cloud |
| **Testes de API** | `request` sem navegador | `cy.request` dentro do navegador |
| **Modelo de código** | `async/await` comum | fila de comandos (`.then` aninhado, sem `await`) |
| **Captura da resposta do front** | `page.route` (precisou trocar `waitForResponse`, que perde o corpo quando a página navega) | `cy.intercept` funcionou de primeira, mesmo com navegação |
| **Setup e limpeza** | fixtures com teardown por teste e projetos de setup/teardown | hooks globais (`afterEach`) e `before/after` por spec |
| **Relatório** | HTML nativo com passos, anexos, vídeo e trace | precisa de reporter externo (mochawesome); prints embutidos |
| **Depuração** | trace viewer (linha do tempo, DOM e rede de cada passo) | Test Runner interativo com *time travel* |
| **Acessibilidade** | `@axe-core/playwright`, pacote oficial da Deque | `cypress-axe` ainda sem suporte ao Cypress 16; `axe-core` injetado à mão |
| **Asserções de texto** | `toContainText` normaliza espaços | `contain.text` compara o texto cru |

Na prática: o Playwright ganhou em velocidade, paralelismo e testes de API puros. O Cypress ganhou na interceptação de rede e no modo interativo para escrever e depurar testes de interface.

## Licença

[MIT](./LICENSE). O ServeRest pertence aos seus autores; este repositório apenas o utiliza como alvo de testes.
