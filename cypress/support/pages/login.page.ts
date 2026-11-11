export const porTestId = (id: string) => cy.get(`[data-testid="${id}"]`);

export class LoginPage {
  email = () => porTestId('email');
  senha = () => porTestId('senha');
  entrarBotao = () => porTestId('entrar');
  alerta = () => cy.get('.alert');

  abrir(): void {
    cy.visit('/login');
  }

  entrar(email: string, senha: string): void {
    this.email().type(email);
    this.senha().type(senha, { log: false });
    this.entrarBotao().click();
  }
}
