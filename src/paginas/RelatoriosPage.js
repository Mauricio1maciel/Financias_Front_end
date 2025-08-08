import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br'; // Importar locale pt-br
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Api from "../servico/Api";

import RelatorioFluxoDeCaixa from './RelatorioFluxoDeCaixa';
import RelatorioDespesasPorCategoria from './RelatorioDespesasPorCategoria';

// Configurar Dayjs
dayjs.locale('pt-br');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess()); // Opcional: definir fuso padrão

export default function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState('fluxoCaixa');
  const [mes, setMes] = useState(dayjs().month() + 1); // Mês atual (1-12)
  const [ano, setAno] = useState(dayjs().year());     // Ano atual
  const [todasMovimentacoes, setTodasMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anosDisponiveis, setAnosDisponiveis] = useState([dayjs().year()]);

  const mesesDoAno = Array.from({ length: 12 }, (_, i) => ({
    valor: i + 1,
    nome: dayjs().month(i).format('MMMM'),
  }));

  useEffect(() => {
    const fetchMovimentacoes = async () => {
      setLoading(true);
      try {
        const { data } = await Api.api.get("/movimentacoes");
        console.log("DEBUG: Todas as Movimentações da API:", data); // <--- ADICIONE AQUI
        setTodasMovimentacoes(data);

        if (data.length > 0) {
          const anos = Array.from(
            new Set(
              data.map(m => {
                const dataRef = m.data_pagamento || m.due_date_vencimento || m.created_at;
                return dataRef ? dayjs(dataRef).year() : dayjs().year();
              })
            )
          ).sort((a, b) => b - a);
          // setAnosDisponiveis(anos.length > 0 ? anos : [dayjs().year()]); // Você já tem essa lógica
        }
      } catch (error) {
        console.error("Erro ao carregar movimentações para relatórios:", error);
        alert("Falha ao carregar dados para os relatórios.");
      }
      setLoading(false);
    };
    fetchMovimentacoes();
  }, []);

  const movimentacoesFiltradasPorPeriodo = todasMovimentacoes.filter(mov => {
    // Priorizar data de pagamento, senão data de vencimento, senão data de criação para definir o período.
    // Ajuste esta lógica conforme a necessidade do seu negócio para "competência" vs "caixa".
    const dataReferencia = mov.data_pagamento || mov.due_date_vencimento;
    if (!dataReferencia) return false; // Ignorar se não houver data de referência relevante

    const dataMovimentacao = dayjs(dataReferencia).tz(dayjs.tz.guess()); // Considerar fuso horário
    return dataMovimentacao.isValid() &&
           dataMovimentacao.year() === ano &&
           (dataMovimentacao.month() + 1) === mes;
  });

  const renderRelatorioSelecionado = () => {
    if (loading) {
      return <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
    }
    if (todasMovimentacoes.length === 0 && !loading) {
        return <p className="text-center">Nenhuma movimentação encontrada para gerar relatórios.</p>;
    }

    switch (tipoRelatorio) {
      case 'fluxoCaixa':
        return <RelatorioFluxoDeCaixa movimentacoesDoPeriodo={movimentacoesFiltradasPorPeriodo} mes={mes} ano={ano} />;
      case 'despesasCategoria':
        const despesasDoPeriodo = movimentacoesFiltradasPorPeriodo.filter(m => m.type === 'Despesa');
        return <RelatorioDespesasPorCategoria movimentacoesDoPeriodo={despesasDoPeriodo} mes={mes} ano={ano} />;
      default:
        return <p className="text-center">Selecione um tipo de relatório e um período.</p>;
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Relatórios Financeiros</h2>

      <div className="row g-3 mb-4 p-3 border bg-light rounded">
        <div className="col-md-4">
          <label htmlFor="tipoRelatorioSelect" className="form-label">Tipo de Relatório</label>
          <select
            id="tipoRelatorioSelect"
            className="form-select"
            value={tipoRelatorio}
            onChange={(e) => setTipoRelatorio(e.target.value)}
          >
            <option value="fluxoCaixa">Fluxo de Caixa Mensal</option>
            <option value="despesasCategoria">Despesas por Categoria (Mensal)</option>
            {/* Futuramente: <option value="receitasFonte">Receitas por Fonte (Mensal)</option> */}
            {/* Futuramente: <option value="fluxoCaixaAnual">Fluxo de Caixa Anual</option> */}
          </select>
        </div>
        <div className="col-md-4">
          <label htmlFor="mesSelect" className="form-label">Mês</label>
          <select
            id="mesSelect"
            className="form-select"
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
          >
            {mesesDoAno.map(m => (
              <option key={m.valor} value={m.valor}>{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label htmlFor="anoSelect" className="form-label">Ano</label>
          <select
            id="anoSelect"
            className="form-select"
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
          >
            {anosDisponiveis.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {renderRelatorioSelecionado()}
        </div>
      </div>
    </div>
  );
}