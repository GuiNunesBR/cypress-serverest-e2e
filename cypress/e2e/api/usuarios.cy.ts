import { api } from '../../support/api/serverest';
import { CadastroSchema, MensagemSchema, UsuarioSchema, validar } from '../../support/api/schemas';
import { novoProduto, novoUsuario } from '../../support/data/factories';
import { limpeza } from '../../support/limpeza';
import { criarUsuarioComSessao } from '../../support/sessao';

describe('API · Usuários', () => {
  it('cadastra usuário com sucesso e respeita o contrato', { tags: '@smoke' }, () => {
    api.criarUsuario(novoUsuario()).then((resposta) => {
      expect(resposta.status).to.eq(201);
      const corpo = validar(CadastroSchema, resposta.body);
      limpeza.usuario(corpo._id);
      expect(corpo.message).to.eq('Cadastro realizado com sucesso');
    });
  });

  it('rejeita e-mail já cadastrado', () => {
    const usuario = novoUsuario();
    api.criarUsuario(usuario).then((primeiro) => limpeza.usuario(validar(CadastroSchema, primeiro.body)._id));

    api.criarUsuario(usuario).then((duplicado) => {
      expect(duplicado.status).to.eq(400);
      expect(validar(MensagemSchema, duplicado.body).message).to.eq('Este email já está sendo usado');
    });
  });

  for (const campo of ['nome', 'email', 'password', 'administrador'] as const) {
    it(`rejeita cadastro sem o campo obrigatório "${campo}"`, () => {
      const dados: Record<string, unknown> = { ...novoUsuario() };
      delete dados[campo];

      api.criarUsuario(dados).then((resposta) => {
        expect(resposta.status).to.eq(400);
        expect(resposta.body).to.have.property(campo);
      });
    });
  }

  it('consulta usuário pelo id', () => {
    const usuario = novoUsuario();
    api.criarUsuario(usuario).then((criado) => {
      const { _id } = validar(CadastroSchema, criado.body);
      limpeza.usuario(_id);

      api.buscarUsuario(_id).then((resposta) => {
        expect(resposta.status).to.eq(200);
        const corpo = validar(UsuarioSchema, resposta.body);
        expect(corpo.email).to.eq(usuario.email);
        expect(corpo.nome).to.eq(usuario.nome);
      });
    });
  });

  it('edita usuário e a consulta mostra os dados novos', () => {
    const novosDados = novoUsuario({ administrador: 'true' });
    api.criarUsuario(novoUsuario()).then((criado) => {
      const { _id } = validar(CadastroSchema, criado.body);
      limpeza.usuario(_id);

      api.editarUsuario(_id, novosDados).then((edicao) => {
        expect(edicao.status).to.eq(200);
        expect(validar(MensagemSchema, edicao.body).message).to.eq('Registro alterado com sucesso');
      });
      api.buscarUsuario(_id).then((consulta) => {
        expect(validar(UsuarioSchema, consulta.body)).to.deep.eq({ ...novosDados, _id });
      });
    });
  });

  it('não exclui usuário com carrinho cadastrado', () => {
    criarUsuarioComSessao('true').then((admin) => {
      criarUsuarioComSessao('false').then((cliente) => {
        api.criarProduto(novoProduto({ quantidade: 10 }), admin.token).then((criado) => {
          const { _id: idProduto } = validar(CadastroSchema, criado.body);
          limpeza.produto(idProduto, admin.token);

          api.criarCarrinho([{ idProduto, quantidade: 1 }], cliente.token).then((carrinho) => {
            const { _id: idCarrinho } = validar(CadastroSchema, carrinho.body);

            api.excluirUsuario(cliente.id).then((exclusao) => {
              expect(exclusao.status).to.eq(400);
              expect(exclusao.body).to.deep.eq({
                message: 'Não é permitido excluir usuário com carrinho cadastrado',
                idCarrinho,
              });
            });
          });
          api.buscarUsuario(cliente.id).its('status').should('eq', 200);
        });
      });
    });
  });

  it('exclui usuário e ele deixa de existir', () => {
    api.criarUsuario(novoUsuario()).then((criado) => {
      const { _id } = validar(CadastroSchema, criado.body);

      api.excluirUsuario(_id).then((exclusao) => {
        expect(exclusao.status).to.eq(200);
        expect(validar(MensagemSchema, exclusao.body).message).to.eq('Registro excluído com sucesso');
      });
      api.buscarUsuario(_id).its('status').should('eq', 400);
    });
  });
});
