import { porTestId } from './login.page';

/** Home do cliente (usuário comum): vitrine de produtos com busca. */
export class LojaPage {
  pesquisa = () => porTestId('pesquisar');
  pesquisarBotao = () => porTestId('botaoPesquisar');
  produtos = () => cy.get('.card');

  abrir(): void {
    cy.visit('/home');
  }

  pesquisar(texto: string): void {
    this.pesquisa().type(texto);
    this.pesquisarBotao().click();
  }

  cardDe(nomeDoProduto: string) {
    return cy.contains('.card', nomeDoProduto);
  }

  adicionarNaLista(nomeDoProduto: string): void {
    this.cardDe(nomeDoProduto).find('[data-testid="adicionarNaLista"]').click();
  }
}

/** Lista de compras do cliente. Fica só no front: nenhuma chamada à API é feita aqui. */
export class ListaDeComprasPage {
  nomeDoProduto = () => porTestId('shopping-cart-product-name');
  quantidade = () => porTestId('shopping-cart-product-quantity');
  preco = () => cy.contains(/^Preço R\$/);
  aumentarBotao = () => porTestId('product-increase-quantity');
  diminuirBotao = () => porTestId('product-decrease-quantity');
  limparBotao = () => porTestId('limparLista');

  abrir(): void {
    cy.visit('/minhaListaDeProdutos');
  }
}
