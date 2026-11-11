import type { NovoProduto } from '../api/serverest';
import { porTestId } from './login.page';

export class CadastrarProdutoPage {
  nome = () => porTestId('nome');
  preco = () => porTestId('preco');
  descricao = () => porTestId('descricao');
  quantidade = () => porTestId('quantity');
  // O data-testid do botão no front é "cadastarProdutos" (sem o "r"); mantido como está no site.
  cadastrarBotao = () => porTestId('cadastarProdutos');

  abrir(): void {
    cy.visit('/admin/cadastrarprodutos');
  }

  preencher(produto: NovoProduto): void {
    this.nome().type(produto.nome);
    this.preco().type(String(produto.preco));
    this.descricao().type(produto.descricao, { delay: 0 });
    this.quantidade().type(String(produto.quantidade));
  }

  enviar(): void {
    this.cadastrarBotao().click();
  }
}

export class ListarProdutosPage {
  abrir(): void {
    cy.visit('/admin/listarprodutos');
  }

  linhaDe(nomeDoProduto: string) {
    return cy.contains('tr', nomeDoProduto);
  }

  excluir(nomeDoProduto: string): void {
    this.linhaDe(nomeDoProduto).contains('button', 'Excluir').click();
  }
}
