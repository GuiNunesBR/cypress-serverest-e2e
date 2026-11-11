import { api } from './api/serverest';
import { ListaProdutosSchema, ListaUsuariosSchema, validar } from './api/schemas';

interface Pendentes {
  usuarios: { id: string; token?: string }[];
  produtos: { id: string; token: string }[];
  emails: string[];
  nomes: { nome: string; token: string }[];
}

const vazio = (): Pendentes => ({ usuarios: [], produtos: [], emails: [], nomes: [] });
let pendentes = vazio();

/** Registro do que o teste criou; tudo é apagado no afterEach global (support/e2e.ts), mesmo se o teste falhar. */
export const limpeza = {
  /** Usuário a apagar (com o token, cancela carrinho aberto antes). */
  usuario: (id: string, token?: string) => void pendentes.usuarios.push({ id, token }),
  /** Produto a apagar (precisa do token de um admin). */
  produto: (id: string, token: string) => void pendentes.produtos.push({ id, token }),
  /** Para dados criados pela interface: o usuário é localizado pelo e-mail no fim do teste. */
  usuarioPorEmail: (email: string) => void pendentes.emails.push(email),
  /** Para dados criados pela interface: o produto é localizado pelo nome no fim do teste. */
  produtoPorNome: (nome: string, token: string) => void pendentes.nomes.push({ nome, token }),
};

export function executarLimpeza(): void {
  const { usuarios, produtos, emails, nomes } = pendentes;
  pendentes = vazio();

  for (const email of emails) {
    api.buscarUsuarioPorEmail(email).then((r) => {
      for (const u of validar(ListaUsuariosSchema, r.body).usuarios) usuarios.push({ id: u._id });
    });
  }
  for (const { nome, token } of nomes) {
    api.listarProdutos({ nome }).then((r) => {
      for (const p of validar(ListaProdutosSchema, r.body).produtos) produtos.push({ id: p._id, token });
    });
  }
  // As listas acima só ficam completas depois das buscas, por isso o resto entra na fila com cy.then.
  cy.then(() => {
    for (const u of usuarios) if (u.token) api.cancelarCompra(u.token);
    for (const p of produtos) api.excluirProduto(p.id, p.token);
    for (const u of usuarios) api.excluirUsuario(u.id);
  });
}
