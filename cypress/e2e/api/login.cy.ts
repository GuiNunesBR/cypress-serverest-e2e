import { api } from '../../support/api/serverest';
import { CadastroSchema, LoginSchema, MensagemSchema, validar } from '../../support/api/schemas';
import { novoUsuario } from '../../support/data/factories';
import { limpeza } from '../../support/limpeza';

describe('API · Login', () => {
  it('login válido devolve token Bearer', { tags: '@smoke' }, () => {
    const usuario = novoUsuario();
    api.criarUsuario(usuario).then((criado) => limpeza.usuario(validar(CadastroSchema, criado.body)._id));

    api.login(usuario.email, usuario.password).then((resposta) => {
      expect(resposta.status).to.eq(200);
      expect(validar(LoginSchema, resposta.body).message).to.eq('Login realizado com sucesso');
    });
  });

  it('rejeita senha incorreta', () => {
    const usuario = novoUsuario();
    api.criarUsuario(usuario).then((criado) => limpeza.usuario(validar(CadastroSchema, criado.body)._id));

    api.login(usuario.email, 'senha-errada').then((resposta) => {
      expect(resposta.status).to.eq(401);
      expect(validar(MensagemSchema, resposta.body).message).to.eq('Email e/ou senha inválidos');
    });
  });

  it('rejeita e-mail inexistente', () => {
    api.login(novoUsuario().email, 'qualquer-senha').then((resposta) => {
      expect(resposta.status).to.eq(401);
      expect(validar(MensagemSchema, resposta.body).message).to.eq('Email e/ou senha inválidos');
    });
  });
});
