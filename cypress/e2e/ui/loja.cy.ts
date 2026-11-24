import { api } from '../../support/api/serverest';
import { CadastroSchema, ListaProdutosSchema, validar } from '../../support/api/schemas';
import { novoProduto, termoSemResultado } from '../../support/data/factories';
import { capturarApi, evidencia } from '../../support/evidencias';
import { limpeza } from '../../support/limpeza';
import { ListaDeComprasPage, LojaPage } from '../../support/pages/loja.page';
import { LoginPage } from '../../support/pages/login.page';
import { criarUsuarioComSessao } from '../../support/sessao';

describe('UI · Loja (cliente)', () => {
  const login = new LoginPage();
  const loja = new LojaPage();
  const lista = new ListaDeComprasPage();

  it('busca um produto e monta a lista de compras', { tags: '@smoke' }, () => {
    const produto = novoProduto();
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(produto, admin.token).then((criado) => {
        limpeza.produto(validar(CadastroSchema, criado.body)._id, admin.token);
      });
    });

    criarUsuarioComSessao('false').then((cliente) => {
      login.abrir();
      login.entrar(cliente.email, cliente.password);
      cy.location('pathname').should('eq', '/home');
    });

    capturarApi('GET', /\/produtos\?nome=/, () => loja.pesquisar(produto.nome)).then((resposta) => {
      expect(resposta.status).to.eq(200);
      const busca = validar(ListaProdutosSchema, resposta.corpo);
      expect(busca.quantidade).to.eq(1);
      expect(busca.produtos[0]).to.include(produto);
    });
    loja.produtos().should('have.length', 1);
    loja.cardDe(produto.nome).should('be.visible');
    evidencia('resultado da busca');

    loja.adicionarNaLista(produto.nome);

    cy.location('pathname').should('eq', '/minhaListaDeProdutos');
    lista.nomeDoProduto().should('contain.text', produto.nome);
    lista.quantidade().should('have.text', 'Total: 1');

    lista.aumentarBotao().click();

    lista.quantidade().should('have.text', 'Total: 2');
    lista.preco().should('have.text', `Preço R$${produto.preco * 2}`);
    evidencia('lista de compras com duas unidades');
  });

  it('busca sem resultado avisa que nada foi encontrado', () => {
    criarUsuarioComSessao('false').then((cliente) => {
      login.abrir();
      login.entrar(cliente.email, cliente.password);
      cy.location('pathname').should('eq', '/home');
    });

    capturarApi('GET', /\/produtos\?nome=/, () => loja.pesquisar(termoSemResultado())).then((resposta) => {
      expect(resposta.status).to.eq(200);
      expect(validar(ListaProdutosSchema, resposta.corpo)).to.deep.eq({ quantidade: 0, produtos: [] });
    });
    loja.semResultado().should('be.visible');
    loja.produtos().should('not.exist');
    evidencia('busca sem resultado');
  });
});
