import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);
dayjs.locale('pt-br');

const formatarValor = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Função para gerar cores para o gráfico de pizza (simples)
const generateBackgroundColors = (count) => {
  const colors = [
    'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(102, 255, 83, 0.7)',
    'rgba(255, 83, 102, 0.7)'
  ];
  let result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};


export default function RelatorioDespesasPorCategoria({ movimentacoesDoPeriodo, mes, ano }) {
  const despesasPorCategoria = movimentacoesDoPeriodo.reduce((acc, despesa) => {
    const categoria = despesa.group_name || 'Sem Categoria';
    if (!acc[categoria]) acc[categoria] = 0;
    acc[categoria] += Number(despesa.value);
    return acc;
  }, {});

  const categorias = Object.keys(despesasPorCategoria);
  const valores = Object.values(despesasPorCategoria);
  const backgroundColors = generateBackgroundColors(categorias.length);

  const nomeMes = dayjs().month(mes - 1).format('MMMM');
  const tituloRelatorio = `Despesas por Categoria - ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;

  const dataChart = {
    labels: categorias,
    datasets: [{
      label: 'Despesas',
      data: valores,
      backgroundColor: backgroundColors,
      borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
      borderWidth: 1,
    }],
  };

  const optionsChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Distribuição de Despesas por Categoria' },
      tooltip: { callbacks: { label: (context) => `${context.label}: ${formatarValor(context.parsed)}` } }
    },
  };

  if (categorias.length === 0) {
    return <p className="text-center fst-italic">Nenhuma despesa encontrada para {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de {ano}.</p>;
  }

  return (
    <div>
      <h4 className="mb-3">{tituloRelatorio}</h4>
      
      <div className="mb-4 p-3 border rounded bg-white" style={{ height: '350px', maxWidth: '450px', margin: 'auto' }}>
        <Pie data={dataChart} options={optionsChart} />
      </div>

      <h5 className="mt-4">Resumo por Categoria</h5>
      <div className="table-responsive">
        <table className="table table-sm table-hover table-striped">
          <thead className="table-light">
            <tr><th>Categoria</th><th className="text-end">Total Gasto</th></tr>
          </thead>
          <tbody>
            {categorias.sort((a,b) => despesasPorCategoria[b] - despesasPorCategoria[a]).map(cat => (
              <tr key={cat}>
                <td>{cat}</td>
                <td className="text-end text-danger">{formatarValor(despesasPorCategoria[cat])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="table-light fw-bold">
            <tr>
              <td>Total Geral</td>
              <td className="text-end text-danger">
                {formatarValor(valores.reduce((acc, val) => acc + val, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}