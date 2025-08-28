import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
dayjs.locale('pt-br');

const formatarValor = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = (dataISO) => dataISO ? dayjs(dataISO).tz(dayjs.tz.guess()).format("DD/MM/YYYY") : "-";

export default function RelatorioFluxoDeCaixa({ movimentacoesDoPeriodo, mes, ano }) {
  const receitas = movimentacoesDoPeriodo.filter(m => m.type === 'Receita');
  const despesas = movimentacoesDoPeriodo.filter(m => m.type === 'Despesa');

  const totalReceitas = receitas.reduce((acc, curr) => acc + Number(curr.value), 0);
  const totalDespesas = despesas.reduce((acc, curr) => acc + Number(curr.value), 0);
  const saldo = totalReceitas - totalDespesas;

  const nomeMes = dayjs().month(mes - 1).format('MMMM');
  const tituloRelatorio = `Fluxo de Caixa - ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;

  const dataChart = {
    labels: [nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)],
    datasets: [
      { label: 'Receitas', data: [totalReceitas], backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgb(75, 192, 192)', borderWidth: 1 },
      { label: 'Despesas', data: [totalDespesas], backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgb(255, 99, 132)', borderWidth: 1 },
    ],
  };

  const optionsChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Receitas vs Despesas do Mês' },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatarValor(context.parsed.y)}` } }
    },
    scales: { y: { ticks: { callback: (value) => formatarValor(value) } } }
  };
  
  if (movimentacoesDoPeriodo.length === 0) {
    return <p className="text-center fst-italic">Nenhuma movimentação encontrada para {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de {ano}.</p>;
  }

  return (
    <div>
      <h4 className="mb-3">{tituloRelatorio}</h4>
      
      <div className="row mb-4 text-center">
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-success shadow-sm">
            <div className="card-header">Total de Receitas</div>
            <div className="card-body"><h5 className="card-title">{formatarValor(totalReceitas)}</h5></div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-danger shadow-sm">
            <div className="card-header">Total de Despesas</div>
            <div className="card-body"><h5 className="card-title">{formatarValor(totalDespesas)}</h5></div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className={`card text-white ${saldo >= 0 ? 'bg-primary' : 'bg-warning'} shadow-sm`}>
            <div className="card-header">Saldo do Mês</div>
            <div className="card-body"><h5 className="card-title">{formatarValor(saldo)}</h5></div>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 border rounded bg-white" style={{ height: '300px', maxWidth: '700px', margin: 'auto' }}>
        <Bar options={optionsChart} data={dataChart} />
      </div>

      <h5 className="mt-4">Detalhes das Receitas ({receitas.length})</h5>
      {receitas.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-sm table-hover table-striped">
            <thead className="table-light"><tr><th>Data</th><th>Descrição</th><th className="text-end">Valor</th></tr></thead>
            <tbody>
              {receitas.map(r => (
                <tr key={`rec-${r.id}`}>
                  <td>{formatarData(r.data_pagamento || r.due_date_vencimento)}</td>
                  <td>{r.group_name}{r.description ? ` - ${r.description}` : ''}</td>
                  <td className="text-end text-success">{formatarValor(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="fst-italic">Nenhuma receita registrada para este período.</p>}

      <h5 className="mt-4">Detalhes das Despesas ({despesas.length})</h5>
      {despesas.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-sm table-hover table-striped">
            <thead className="table-light"><tr><th>Data</th><th>Descrição</th><th className="text-end">Valor</th></tr></thead>
            <tbody>
              {despesas.map(d => (
                <tr key={`desp-${d.id}`}>
                  <td>{formatarData(d.data_pagamento || d.due_date_vencimento)}</td>
                  <td>{d.group_name}{d.description ? ` - ${d.description}` : ''}</td>
                  <td className="text-end text-danger">{formatarValor(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="fst-italic">Nenhuma despesa registrada para este período.</p>}
    </div>
  );
}