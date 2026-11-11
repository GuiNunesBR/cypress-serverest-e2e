import { porTestId } from './login.page';

export class AdminHomePage {
  saudacao = () => cy.contains('h1', 'Bem Vindo');
  sairBotao = () => porTestId('logout');

  abrir(): void {
    cy.visit('/admin/home');
  }

  sair(): void {
    this.sairBotao().click();
  }
}
