import 'cypress-mochawesome-reporter/register';
import { register as registerCypressGrep } from '@cypress/grep';
import { executarLimpeza } from './limpeza';

registerCypressGrep();

// Tudo que o teste registrou em `limpeza` é apagado aqui, mesmo quando o teste falha.
afterEach(() => {
  executarLimpeza();
});
