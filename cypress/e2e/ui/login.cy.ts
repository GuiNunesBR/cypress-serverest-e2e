import { LoginSchema, MensagemSchema, validar } from '../../support/api/schemas';
import { capturarApi, evidencia } from '../../support/evidencias';
import { AdminHomePage } from '../../support/pages/admin-home.page';
import { LoginPage } from '../../support/pages/login.page';
import { criarUsuarioComSessao } from '../../support/sessao';

describe('UI · Login', () => {
  const login = new LoginPage();
  const home = new AdminHomePage();

  it('admin entra e vê a home administrativa', { tags: '@smoke' }, () => {
    criarUsuarioComSessao('true').then((admin) => {
      login.abrir();

      capturarApi('POST', '/login', () => login.entrar(admin.email, admin.password)).then((resposta) => {
        expect(resposta.status).to.eq(200);
        expect(validar(LoginSchema, resposta.corpo).message).to.eq('Login realizado com sucesso');
      });

      cy.location('pathname').should('eq', '/admin/home');
      // O front renderiza "Bem Vindo  <nome>" com espaço duplo; o Cypress não normaliza espaços como o Playwright.
      home.saudacao().should('contain.text', 'Bem Vindo').and('contain.text', admin.nome);
      evidencia('home administrativa após o login');
    });
  });

  it('mostra erro com credenciais inválidas', () => {
    login.abrir();

    capturarApi('POST', '/login', () => login.entrar('nao.existe@teste.com', 'senha-errada')).then((resposta) => {
      expect(resposta.status).to.eq(401);
      expect(validar(MensagemSchema, resposta.corpo).message).to.eq('Email e/ou senha inválidos');
    });

    login.alerta().should('contain.text', 'Email e/ou senha inválidos');
    cy.location('pathname').should('eq', '/login');
    evidencia('alerta de credenciais inválidas');
  });

  it('sai do sistema e volta para a tela de login', () => {
    criarUsuarioComSessao('true').then((admin) => {
      login.abrir();
      login.entrar(admin.email, admin.password);
      cy.location('pathname').should('eq', '/admin/home');

      home.sair();

      cy.location('pathname').should('eq', '/login');
      login.entrarBotao().should('be.visible');
      evidencia('tela de login após o logout');
    });
  });
});
