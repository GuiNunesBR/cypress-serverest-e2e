import { api } from '../../support/api/serverest';
import { CadastroSchema, MensagemSchema, validar } from '../../support/api/schemas';
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
});
