import { describe, expect, it } from 'vitest';
import { PAGINAS, TAGS_WCAG } from '../cypress/support/a11y/paginas';

// A lista de páginas e a linha de base são dados: um erro aqui faria a auditoria pular uma tela sem ninguém notar.
describe('Unidade · páginas auditadas', () => {
  it('cada rota aparece uma vez só', () => {
    const rotas = PAGINAS.map((p) => p.rota);
    expect(new Set(rotas).size).toBe(rotas.length);
    expect(rotas).toHaveLength(9);
  });

  it('toda página tem seletor de pronta e linha de base com regras do axe', () => {
    for (const pagina of PAGINAS) {
      expect(pagina.rota).toMatch(/^\//);
      expect(pagina.pronta.trim()).not.toBe('');
      expect(pagina.conhecidas.length).toBeGreaterThan(0);
      expect(new Set(pagina.conhecidas).size).toBe(pagina.conhecidas.length);
    }
  });

  it('a auditoria cobre WCAG 2.1 níveis A e AA', () => {
    expect(TAGS_WCAG).toEqual(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  });
});
