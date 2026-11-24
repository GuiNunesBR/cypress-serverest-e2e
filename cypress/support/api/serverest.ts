export type Booleano = 'true' | 'false';

export interface NovoUsuario {
  nome: string;
  email: string;
  password: string;
  administrador: Booleano;
}

export interface NovoProduto {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

export interface ItemCarrinho {
  idProduto: string;
  quantidade: number;
}

type Resposta = Cypress.Response<unknown>;

interface Opcoes {
  body?: unknown;
  qs?: Record<string, string>;
  token?: string;
}

/** Faz a chamada sem falhar por status (quem testa é o teste) e anexa requisição e resposta ao relatório. */
function chamar(metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', caminho: string, opcoes: Opcoes = {}): Cypress.Chainable<Resposta> {
  const { body, qs, token } = opcoes;
  return cy
    .request({
      method: metodo,
      url: `${Cypress.expose('apiUrl')}${caminho}`,
      body: body as Cypress.RequestBody,
      qs,
      headers: token ? { Authorization: token } : {},
      failOnStatusCode: false,
    })
    .then((resposta) => {
      const query = qs ? `?${new URLSearchParams(qs)}` : '';
      cy.addTestContext({
        title: `API ${metodo} ${caminho}${query} → ${resposta.status}`,
        value: {
          requisicao: { metodo, url: `${Cypress.expose('apiUrl')}${caminho}${query}`, corpo: body ?? null },
          resposta: { status: resposta.status, corpo: resposta.body },
        },
      });
      return cy.wrap(resposta, { log: false });
    });
}

/** Cliente da API do ServeRest: uma função por endpoint, sem asserções. */
export const api = {
  // ---- usuários
  criarUsuario: (dados: object) => chamar('POST', '/usuarios', { body: dados }),
  buscarUsuario: (id: string) => chamar('GET', `/usuarios/${id}`),
  buscarUsuarioPorEmail: (email: string) => chamar('GET', '/usuarios', { qs: { email } }),
  editarUsuario: (id: string, dados: object) => chamar('PUT', `/usuarios/${id}`, { body: dados }),
  excluirUsuario: (id: string) => chamar('DELETE', `/usuarios/${id}`),

  // ---- login
  login: (email: string, password: string) => chamar('POST', '/login', { body: { email, password } }),

  // ---- produtos
  criarProduto: (dados: object, token?: string) => chamar('POST', '/produtos', { body: dados, token }),
  buscarProduto: (id: string) => chamar('GET', `/produtos/${id}`),
  listarProdutos: (qs: Record<string, string> = {}) => chamar('GET', '/produtos', { qs }),
  excluirProduto: (id: string, token?: string) => chamar('DELETE', `/produtos/${id}`, { token }),

  // ---- carrinhos
  criarCarrinho: (produtos: ItemCarrinho[], token?: string) => chamar('POST', '/carrinhos', { body: { produtos }, token }),
  buscarCarrinho: (id: string) => chamar('GET', `/carrinhos/${id}`),
  concluirCompra: (token?: string) => chamar('DELETE', '/carrinhos/concluir-compra', { token }),
  cancelarCompra: (token?: string) => chamar('DELETE', '/carrinhos/cancelar-compra', { token }),
};
