import { analisarAcessibilidade } from '../../support/a11y/axe';
import { PAGINAS, type PaginaAuditada } from '../../support/a11y/paginas';
import { LoginPage } from '../../support/pages/login.page';
import { criarUsuarioComSessao, usarAdminDaSuite } from '../../support/sessao';

function auditar(pagina: PaginaAuditada) {
  it(`${pagina.rota} não ganha violações novas de WCAG 2.1 AA`, { tags: '@a11y' }, () => {
    if (pagina.perfil === 'cliente') {
      criarUsuarioComSessao('false').then((cliente) => {
        const login = new LoginPage();
        login.abrir();
        login.entrar(cliente.email, cliente.password);
        cy.location('pathname').should('eq', '/home');
      });
    }

    cy.visit(pagina.rota);
    cy.get(pagina.pronta).first().should('be.visible');

    analisarAcessibilidade().then((violadas) => {
      const pendentes = violadas.filter((regra) => pagina.conhecidas.includes(regra));
      if (pendentes.length) {
        cy.addTestContext({ title: 'Pendências de acessibilidade', value: pendentes.join(', ') });
      }
      expect(violadas.filter((regra) => !pagina.conhecidas.includes(regra)), 'regras violadas fora da linha de base').to.deep.eq([]);
    });
  });
}

describe('Acessibilidade · páginas públicas', () => {
  for (const pagina of PAGINAS.filter((p) => p.perfil === 'anonimo')) auditar(pagina);
});

describe('Acessibilidade · painel do admin', () => {
  usarAdminDaSuite();
  for (const pagina of PAGINAS.filter((p) => p.perfil === 'admin')) auditar(pagina);
});

describe('Acessibilidade · loja do cliente', () => {
  for (const pagina of PAGINAS.filter((p) => p.perfil === 'cliente')) auditar(pagina);
});
