import { api } from '../../support/api/serverest';
import { CadastroSchema, MensagemSchema, ProdutoSchema, validar } from '../../support/api/schemas';
import { novoProduto } from '../../support/data/factories';
import { capturarApi, evidencia } from '../../support/evidencias';
import { limpeza } from '../../support/limpeza';
import { CadastrarProdutoPage, ListarProdutosPage } from '../../support/pages/produtos.page';
import { usarAdminDaSuite } from '../../support/sessao';

describe('UI · Produtos (admin)', () => {
  const admin = usarAdminDaSuite();
  const cadastro = new CadastrarProdutoPage();
  const listagem = new ListarProdutosPage();

  it('cadastra um produto e o encontra na listagem', { tags: '@smoke' }, () => {
    const produto = novoProduto();
    limpeza.produtoPorNome(produto.nome, admin().token);

    cadastro.abrir();
    cadastro.preencher(produto);
    evidencia('formulário de produto preenchido');

    capturarApi('POST', '/produtos', () => cadastro.enviar()).then((resposta) => {
      expect(resposta.status).to.eq(201);
      const { _id } = validar(CadastroSchema, resposta.corpo);

      cy.location('pathname').should('eq', '/admin/listarprodutos');
      listagem.linhaDe(produto.nome).should('be.visible').and('contain.text', String(produto.preco));
      evidencia('produto na listagem');

      api.buscarProduto(_id).then((consulta) => {
        expect(validar(ProdutoSchema, consulta.body)).to.deep.eq({ ...produto, _id });
      });
    });
  });

  it('exclui um produto pela listagem', () => {
    const produto = novoProduto();
    api.criarProduto(produto, admin().token).then((criado) => {
      const { _id } = validar(CadastroSchema, criado.body);
      limpeza.produto(_id, admin().token);

      listagem.abrir();
      listagem.linhaDe(produto.nome).should('be.visible');
      evidencia('produto antes da exclusão');

      capturarApi('DELETE', `/produtos/${_id}`, () => listagem.excluir(produto.nome)).then((resposta) => {
        expect(resposta.status).to.eq(200);
        expect(validar(MensagemSchema, resposta.corpo).message).to.eq('Registro excluído com sucesso');
      });

      cy.contains('tr', produto.nome).should('not.exist');
      evidencia('listagem sem o produto');

      api.buscarProduto(_id).then((consulta) => {
        expect(consulta.status).to.eq(400);
        expect(validar(MensagemSchema, consulta.body).message).to.eq('Produto não encontrado');
      });
    });
  });
});
