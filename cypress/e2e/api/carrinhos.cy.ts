import { api } from '../../support/api/serverest';
import { CadastroSchema, CarrinhoSchema, MensagemSchema, ProdutoSchema, validar } from '../../support/api/schemas';
import { novoProduto } from '../../support/data/factories';
import { limpeza } from '../../support/limpeza';
import { criarUsuarioComSessao } from '../../support/sessao';

describe('API · Carrinhos', () => {
  it('monta um carrinho e conclui a compra', { tags: '@smoke' }, () => {
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(novoProduto({ quantidade: 10 }), admin.token).then((criado) => {
        const { _id: idProduto } = validar(CadastroSchema, criado.body);
        limpeza.produto(idProduto, admin.token);

        api.criarCarrinho([{ idProduto, quantidade: 2 }], admin.token).then((carrinho) => {
          expect(carrinho.status).to.eq(201);
          expect(validar(CadastroSchema, carrinho.body).message).to.eq('Cadastro realizado com sucesso');
        });

        api.concluirCompra(admin.token).then((compra) => {
          expect(compra.status).to.eq(200);
          expect(validar(MensagemSchema, compra.body).message).to.eq('Registro excluído com sucesso');
        });
      });
    });
  });

  it('reserva o estoque no carrinho e o devolve ao cancelar a compra', () => {
    const produto = novoProduto({ quantidade: 5 });
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(produto, admin.token).then((criado) => {
        const { _id: idProduto } = validar(CadastroSchema, criado.body);
        limpeza.produto(idProduto, admin.token);

        api.criarCarrinho([{ idProduto, quantidade: 2 }], admin.token).then((carrinho) => {
          const { _id: idCarrinho } = validar(CadastroSchema, carrinho.body);

          api.buscarCarrinho(idCarrinho).then((consulta) => {
            expect(validar(CarrinhoSchema, consulta.body)).to.deep.eq({
              produtos: [{ idProduto, quantidade: 2, precoUnitario: produto.preco }],
              precoTotal: produto.preco * 2,
              quantidadeTotal: 2,
              idUsuario: admin.id,
              _id: idCarrinho,
            });
          });
        });
        api.buscarProduto(idProduto).then((consulta) => {
          expect(validar(ProdutoSchema, consulta.body).quantidade).to.eq(3);
        });

        api.cancelarCompra(admin.token).then((cancelamento) => {
          expect(cancelamento.status).to.eq(200);
          expect(validar(MensagemSchema, cancelamento.body).message).to.eq(
            'Registro excluído com sucesso. Estoque dos produtos reabastecido',
          );
        });
        api.buscarProduto(idProduto).then((consulta) => {
          expect(validar(ProdutoSchema, consulta.body).quantidade).to.eq(5);
        });
      });
    });
  });

  it('rejeita quantidade maior que o estoque', () => {
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(novoProduto({ quantidade: 5 }), admin.token).then((criado) => {
        const { _id: idProduto } = validar(CadastroSchema, criado.body);
        limpeza.produto(idProduto, admin.token);

        api.criarCarrinho([{ idProduto, quantidade: 6 }], admin.token).then((carrinho) => {
          expect(carrinho.status).to.eq(400);
          expect(carrinho.body).to.deep.eq({
            message: 'Produto não possui quantidade suficiente',
            item: { idProduto, quantidade: 6, quantidadeEstoque: 5, index: 0 },
          });
        });
      });
    });
  });

  it('não permite mais de um carrinho por usuário', () => {
    criarUsuarioComSessao('true').then((admin) => {
      api.criarProduto(novoProduto({ quantidade: 10 }), admin.token).then((criado) => {
        const { _id: idProduto } = validar(CadastroSchema, criado.body);
        limpeza.produto(idProduto, admin.token);
        api.criarCarrinho([{ idProduto, quantidade: 1 }], admin.token).its('status').should('eq', 201);

        api.criarCarrinho([{ idProduto, quantidade: 1 }], admin.token).then((segundo) => {
          expect(segundo.status).to.eq(400);
          expect(validar(MensagemSchema, segundo.body).message).to.eq('Não é permitido ter mais de 1 carrinho');
        });
      });
    });
  });
});
