import { api } from '../../support/api/serverest';
import { CadastroSchema, MensagemSchema, UsuarioSchema, validar } from '../../support/api/schemas';
import { novoUsuario } from '../../support/data/factories';
import { limpeza } from '../../support/limpeza';

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
