import { api } from '../../support/api/serverest';
import { CadastroSchema, MensagemSchema, UsuarioSchema, validar } from '../../support/api/schemas';
import { novoUsuario } from '../../support/data/factories';
import { capturarApi, evidencia } from '../../support/evidencias';
import { limpeza } from '../../support/limpeza';
import { CadastroUsuarioPage } from '../../support/pages/cadastro-usuario.page';

describe('UI · Cadastro de usuário', () => {
  const cadastro = new CadastroUsuarioPage();

  it('cadastra um administrador e entra direto na home', { tags: '@smoke' }, () => {
    const usuario = novoUsuario({ administrador: 'true' });
    limpeza.usuarioPorEmail(usuario.email);

    cadastro.abrir();
    cadastro.preencher(usuario);
    evidencia('formulário de cadastro preenchido');

    capturarApi('POST', '/usuarios', () => cadastro.enviar()).then((resposta) => {
      expect(resposta.status).to.eq(201);
      const { _id } = validar(CadastroSchema, resposta.corpo);

      cadastro.alerta().should('contain.text', 'Cadastro realizado com sucesso');
      cy.location('pathname').should('eq', '/admin/home');
      evidencia('home administrativa após o cadastro');

      // O registro tem que existir na API com os dados digitados na tela.
      api.buscarUsuario(_id).then((consulta) => {
        expect(validar(UsuarioSchema, consulta.body)).to.include({
          nome: usuario.nome,
          email: usuario.email,
          administrador: 'true',
        });
      });
    });
  });

  it('não permite cadastrar um e-mail que já existe', () => {
    const usuario = novoUsuario();
    api.criarUsuario(usuario).then((criado) => limpeza.usuario(validar(CadastroSchema, criado.body)._id));

    cadastro.abrir();
    cadastro.preencher(usuario);

    capturarApi('POST', '/usuarios', () => cadastro.enviar()).then((resposta) => {
      expect(resposta.status).to.eq(400);
      expect(validar(MensagemSchema, resposta.corpo).message).to.eq('Este email já está sendo usado');
    });

    cadastro.alerta().should('contain.text', 'Este email já está sendo usado');
    evidencia('alerta de e-mail duplicado');
  });
});
