import { api, type Booleano } from './api/serverest';
import { CadastroSchema, LoginSchema, validar } from './api/schemas';
import { novoUsuario } from './data/factories';
import { limpeza } from './limpeza';
import { LoginPage } from './pages/login.page';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  password: string;
  token: string;
}

function cadastrarComToken(administrador: Booleano, nome?: string): Cypress.Chainable<UsuarioSessao> {
  const dados = novoUsuario({ administrador, ...(nome ? { nome } : {}) });
  return api.criarUsuario(dados).then((cadastro) => {
    expect(cadastro.status, 'cadastro do usuário de apoio').to.eq(201);
    const { _id } = validar(CadastroSchema, cadastro.body);
    return api.login(dados.email, dados.password).then((login) => {
      const { authorization } = validar(LoginSchema, login.body);
      return cy.wrap<UsuarioSessao>({ id: _id, nome: dados.nome, email: dados.email, password: dados.password, token: authorization }, { log: false });
    });
  });
}

/** Cria um usuário (admin ou cliente) pela API, já com token, e o registra para limpeza ao fim do teste. */
export function criarUsuarioComSessao(administrador: Booleano): Cypress.Chainable<UsuarioSessao> {
  return cadastrarComToken(administrador).then((sessao) => {
    limpeza.usuario(sessao.id, sessao.token);
    return cy.wrap(sessao, { log: false });
  });
}

/**
 * Admin compartilhado pelos testes de um spec: criado no before, removido no after
 * e autenticado pela interface com cy.session antes de cada teste.
 */
export function usarAdminDaSuite(): () => UsuarioSessao {
  let admin: UsuarioSessao;
  before(() => {
    cadastrarComToken('true', 'Admin QA').then((sessao) => {
      admin = sessao;
    });
  });
  beforeEach(() => {
    entrarComo(admin);
  });
  after(() => {
    api.cancelarCompra(admin.token);
    api.excluirUsuario(admin.id);
  });
  return () => admin;
}

/** Entra pela interface uma vez e reaproveita a sessão (cy.session) nos testes seguintes. */
export function entrarComo(usuario: Pick<UsuarioSessao, 'email' | 'password'>): void {
  cy.session(usuario.email, () => {
    const login = new LoginPage();
    login.abrir();
    login.entrar(usuario.email, usuario.password);
    cy.location('pathname').should('not.eq', '/login');
  });
}
