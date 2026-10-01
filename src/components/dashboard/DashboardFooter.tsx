import type { DashboardData } from '../../types/dashboard';

interface DashboardFooterProps {
  data: DashboardData;
  selectedRows: number;
}

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function DashboardFooter({ data, selectedRows }: DashboardFooterProps) {
  return (
    <footer className="foot">
      <span>Fonte: OCs + Saving · Y2Date · Jan–Jul 2026 (base revisada, saving atualizado)</span>
      <span>{number.format(selectedRows)} de {number.format(data.rows.length)} linhas de OC na seleção · no período: {number.format(data.meta.nOCs)} OCs, {number.format(data.requisicoes.length)} requisições e {number.format(data.protocolos.length)} notas protocoladas</span>
      <span>Conversão: US$ 1,00 = R$ 5,20</span>
      <span>Mês atribuído pela data de criação da ordem</span>
      <span>Notas fiscais: mês da data do protocolo</span>
      <span>Requisições: Oracle até maio · 1DOC de junho em diante · contagem por requisição única</span>
    </footer>
  );
}
