import type { AxeResults, RunOptions } from 'axe-core';
import { TAGS_WCAG } from './paginas';

type JanelaComAxe = Window & {
  eval: (codigo: string) => void;
  axe: { run: (contexto: Document, opcoes: RunOptions) => Promise<AxeResults> };
};

/**
 * Injeta o axe-core na página, roda a análise, anexa o resultado ao relatório e devolve as regras violadas.
 * O cypress-axe ainda não declara suporte ao Cypress 16, então o axe-core é usado diretamente.
 */
export function analisarAcessibilidade(): Cypress.Chainable<string[]> {
  cy.readFile<string>('node_modules/axe-core/axe.min.js', { log: false }).then((fonte) => {
    cy.window({ log: false }).then((win) => (win as unknown as JanelaComAxe).eval(fonte));
  });

  return cy
    .window({ log: false })
    .then((win) => {
      const execucao = (win as unknown as JanelaComAxe).axe.run(win.document, { runOnly: { type: 'tag', values: TAGS_WCAG } });
      return cy.wrap<Promise<AxeResults>, AxeResults>(execucao, { log: false, timeout: 30_000 });
    })
    .then((resultado) => {
      const violacoes = resultado.violations.map((v) => ({
        regra: v.id,
        impacto: v.impact,
        descricao: v.help,
        ocorrencias: v.nodes.length,
        elementos: v.nodes.slice(0, 10).map((n) => n.target.join(' ')),
        referencia: v.helpUrl,
      }));
      cy.addTestContext({ title: 'Acessibilidade (axe)', value: { url: resultado.url, tags: TAGS_WCAG, violacoes } });
      return cy.wrap(violacoes.map((v) => v.regra).sort(), { log: false });
    });
}
