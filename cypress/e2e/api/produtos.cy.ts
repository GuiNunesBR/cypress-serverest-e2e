import { api } from '../../support/api/serverest';
import { CadastroSchema, ListaProdutosSchema, MensagemSchema, ProdutoSchema, validar } from '../../support/api/schemas';
import { novoProduto } from '../../support/data/factories';
import { limpeza } from '../../support/limpeza';
import { criarUsuarioComSessao } from '../../support/sessao';

describe('API · Produtos', () => {
  it('admin cadastra produto e consulta pelo id', { tags: '@smoke' }, () => {
    const produto = novoProduto();
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(produto, admin.token).then((criado) => {
        expect(criado.status).to.eq(201);
        const { _id } = validar(CadastroSchema, criado.body);
        limpeza.produto(_id, admin.token);

        api.buscarProduto(_id).then((consulta) => {
          expect(consulta.status).to.eq(200);
          expect(validar(ProdutoSchema, consulta.body)).to.deep.eq({ ...produto, _id });
        });
      });
    });
  });

  it('exige token de acesso', () => {
    api.criarProduto(novoProduto()).then((resposta) => {
      expect(resposta.status).to.eq(401);
      expect(validar(MensagemSchema, resposta.body).message).to.eq(
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
      );
    });
  });

  it('não permite dois produtos com o mesmo nome', () => {
    const produto = novoProduto();
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(produto, admin.token).then((primeiro) => {
        limpeza.produto(validar(CadastroSchema, primeiro.body)._id, admin.token);
      });

      api.criarProduto(produto, admin.token).then((duplicado) => {
        expect(duplicado.status).to.eq(400);
        expect(validar(MensagemSchema, duplicado.body).message).to.eq('Já existe produto com esse nome');
      });
    });
  });

  it('rejeita preço negativo', () => {
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(novoProduto({ preco: -1 }), admin.token).then((resposta) => {
        expect(resposta.status).to.eq(400);
        expect(resposta.body).to.deep.eq({ preco: 'preco deve ser um número positivo' });
      });
    });
  });

  it('filtra a listagem pelo nome', () => {
    const produto = novoProduto();
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(produto, admin.token).then((criado) => {
        const { _id } = validar(CadastroSchema, criado.body);
        limpeza.produto(_id, admin.token);

        api.listarProdutos({ nome: produto.nome }).then((resposta) => {
          const lista = validar(ListaProdutosSchema, resposta.body);
          expect(lista.quantidade).to.eq(1);
          expect(lista.produtos[0]._id).to.eq(_id);
        });
      });
    });
  });

  it('exclui produto', () => {
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(novoProduto(), admin.token).then((criado) => {
        const { _id } = validar(CadastroSchema, criado.body);

        api.excluirProduto(_id, admin.token).then((exclusao) => {
          expect(exclusao.status).to.eq(200);
          expect(validar(MensagemSchema, exclusao.body).message).to.eq('Registro excluído com sucesso');
        });
      });
    });
  });
});
