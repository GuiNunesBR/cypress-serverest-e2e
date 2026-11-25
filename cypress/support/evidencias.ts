export interface RespostaCapturada {
  status: number;
  corpo: unknown;
}

let sequencia = 0;

/**
 * Executa `acao` e devolve a resposta da chamada que o front fez para a API, anexando-a ao relatório.
 * `caminho` em texto compara só o path; uma RegExp é testada contra a URL completa.
 * Se a ação falhar (um seletor que sumiu, por exemplo), o Cypress para no comando dela e o erro dela é o que
 * aparece: o `cy.wait` nem chega a rodar.
 */
export function capturarApi(metodo: string, caminho: string | RegExp, acao: () => void): Cypress.Chainable<RespostaCapturada> {
  const alias = `front${++sequencia}`;
  const apiUrl = new URL(Cypress.expose('apiUrl'));
  cy.intercept(
    typeof caminho === 'string' ? { method: metodo, hostname: apiUrl.hostname, pathname: caminho } : { method: metodo, url: caminho },
  ).as(alias);

  acao();

  return cy.wait(`@${alias}`).then(({ request, response }) => {
    const url = new URL(request.url);
    const status = response?.statusCode ?? 0;
    const corpo = response?.body;
    cy.addTestContext({
      title: `Front ${metodo} ${url.pathname}${url.search} → ${status}`,
      value: {
        requisicao: { metodo, url: request.url, corpo: request.body || null },
        resposta: { status, corpo },
      },
    });
    return cy.wrap<RespostaCapturada>({ status, corpo }, { log: false });
  });
}

/** Print da tela inteira anexado ao relatório como evidência. */
export function evidencia(descricao: string): void {
  cy.screenshot(descricao, { capture: 'fullPage' });
}
