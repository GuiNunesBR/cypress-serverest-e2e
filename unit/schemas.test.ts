import { describe, expect, it } from 'vitest';
import { CadastroSchema, ListaProdutosSchema, LoginSchema, ProdutoSchema, UsuarioSchema, validar } from '../cypress/support/api/schemas';

const produto = { nome: 'Produto x1', preco: 120, descricao: 'Mouse', quantidade: 3, _id: 'abc123' };

// Os contratos só servem se recusarem o que está errado: cada teste aqui tem um caso que precisa falhar.
describe('Unidade · contratos (schemas)', () => {
  it('validar devolve o objeto tipado quando o contrato bate', () => {
    expect(validar(ProdutoSchema, produto)).toEqual(produto);
    expect(validar(ListaProdutosSchema, { quantidade: 1, produtos: [produto] }).produtos[0]._id).toBe('abc123');
  });

  it('preço em texto quebra o contrato e a mensagem aponta o campo', () => {
    expect(() => validar(ProdutoSchema, { ...produto, preco: '120' })).toThrow(/Contrato inválido[\s\S]*preco/);
  });

  it('campo obrigatório ausente quebra o contrato', () => {
    const { _id, ...semId } = produto;
    expect(_id).toBeTruthy();
    expect(() => validar(ProdutoSchema, semId)).toThrow(/_id/);
    expect(() => validar(CadastroSchema, { message: 'Cadastro realizado com sucesso', _id: '' })).toThrow(/_id/);
  });

  it('o token do login precisa vir no formato Bearer', () => {
    expect(validar(LoginSchema, { message: 'ok', authorization: 'Bearer abc' }).authorization).toBe('Bearer abc');
    expect(() => validar(LoginSchema, { message: 'ok', authorization: 'abc' })).toThrow(/authorization/);
  });

  it('administrador aceita só "true" ou "false" em texto', () => {
    const usuario = { nome: 'Fulano', email: 'qa.x@teste.com', password: 'segredo123', administrador: 'true', _id: 'u1' };
    expect(validar(UsuarioSchema, usuario).administrador).toBe('true');
    expect(() => validar(UsuarioSchema, { ...usuario, administrador: true })).toThrow(/administrador/);
  });
});
