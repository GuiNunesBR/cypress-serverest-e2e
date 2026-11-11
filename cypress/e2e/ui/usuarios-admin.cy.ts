import { api } from '../../support/api/serverest';
import { CadastroSchema, UsuarioSchema, validar } from '../../support/api/schemas';
import { novoUsuario } from '../../support/data/factories';
import { capturarApi, evidencia } from '../../support/evidencias';
import { limpeza } from '../../support/limpeza';
import { cadastroPeloPainel, ListarUsuariosPage } from '../../support/pages/cadastro-usuario.page';
import { usarAdminDaSuite } from '../../support/sessao';

describe('UI · Usuários (admin)', () => {
  usarAdminDaSuite();
  const cadastro = cadastroPeloPainel();
  const listagem = new ListarUsuariosPage();

  it('cadastra um cliente pelo painel e o encontra na listagem', { tags: '@smoke' }, () => {
    const usuario = novoUsuario();
    limpeza.usuarioPorEmail(usuario.email);

    cadastro.abrir();
    cadastro.preencher(usuario);
    evidencia('formulário de usuário preenchido');

    capturarApi('POST', '/usuarios', () => cadastro.enviar()).then((resposta) => {
      expect(resposta.status).to.eq(201);
      const { _id } = validar(CadastroSchema, resposta.corpo);

      cy.location('pathname').should('eq', '/admin/listarusuarios');
      listagem.linhaDe(usuario.email).should('contain.text', usuario.nome).and('contain.text', 'false');
      evidencia('usuário na listagem');

      api.buscarUsuario(_id).then((consulta) => {
        expect(validar(UsuarioSchema, consulta.body)).to.include({
          nome: usuario.nome,
          email: usuario.email,
          administrador: 'false',
        });
      });
    });
  });
});
