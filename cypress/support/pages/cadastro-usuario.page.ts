import type { NovoUsuario } from '../api/serverest';
import { porTestId } from './login.page';

/** Tela pública de cadastro (/cadastrarusuarios) e a do painel do admin, que muda só a rota e o botão. */
export class CadastroUsuarioPage {
  constructor(
    private readonly rota = '/cadastrarusuarios',
    private readonly botao = 'cadastrar',
  ) {}

  nome = () => porTestId('nome');
  email = () => porTestId('email');
  senha = () => porTestId('password');
  administrador = () => porTestId('checkbox');
  cadastrarBotao = () => porTestId(this.botao);
  alerta = () => cy.get('.alert');

  abrir(): void {
    cy.visit(this.rota);
  }

  preencher(usuario: NovoUsuario): void {
    this.nome().type(usuario.nome);
    this.email().type(usuario.email);
    this.senha().type(usuario.password, { log: false });
    if (usuario.administrador === 'true') this.administrador().check();
  }

  enviar(): void {
    this.cadastrarBotao().click();
  }
}

// No painel o botão é "cadastrarUsuario"; na tela pública é "cadastrar".
export const cadastroPeloPainel = () => new CadastroUsuarioPage('/admin/cadastrarusuarios', 'cadastrarUsuario');

export class ListarUsuariosPage {
  abrir(): void {
    cy.visit('/admin/listarusuarios');
  }

  linhaDe(email: string) {
    return cy.contains('tr', email);
  }
}
