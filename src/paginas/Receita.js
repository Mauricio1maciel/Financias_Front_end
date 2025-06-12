import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Estender Dayjs com plugins de UTC e Timezone
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Receitas() {
  const [dados, setDados] = useState([]);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [filtroRecebido, setFiltroRecebido] = useState("todos");

  const listar = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/movimentacoes");
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
    }
  };

  useEffect(() => {
    listar();
  }, []);

  const formatarData = (dataISO) => {
    if (!dataISO) return "-";
    return dayjs(dataISO).tz(dayjs.tz.guess()).format("DD/MM/YYYY");
  };

  const formatarValor = (valor) => {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const toggleRecebido = async (id, recebidoAtual) => {
    setLoadingUpdate(true);
    try {
      await axios.put(`http://localhost:5000/movimentacoes/${id}`, {
        paid: !recebidoAtual,
      });
      await listar();
    } catch (error) {
      console.error("Erro ao atualizar status de recebimento:", error);
      alert("Erro ao atualizar status de recebimento. Tente novamente.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const dadosFiltrados = dados
    .filter((d) => d.type === "Receita")
    .filter((d) => {
      if (filtroRecebido === "recebidos") return d.paid === true;
      if (filtroRecebido === "nao-recebidos") return d.paid === false;
      return true;
    });

  const totalReceitas = dadosFiltrados.reduce(
    (acc, curr) => acc + Number(curr.value),
    0
  );

  const aReceberVencidas = dadosFiltrados.filter(
    (d) => !d.paid && d.due_date_vencimento && dayjs(d.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))
  );

  const recebidas = dadosFiltrados.filter((d) => d.paid);
  const aReceber = dadosFiltrados.filter((d) => !d.paid);

  const handleExportExcel = () => {
    const dadosParaExportar = dadosFiltrados.map(mov => {
      let statusPrevisao = "";
      if (mov.paid) {
        statusPrevisao = `Recebido em ${formatarData(mov.data_pagamento)}`;
      } else if (mov.due_date_vencimento) {
        if (dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))) {
          statusPrevisao = `Previsão Vencida: ${formatarData(mov.due_date_vencimento)}`;
        } else {
          statusPrevisao = `Previsto para ${formatarData(mov.due_date_vencimento)}`;
        }
      } else {
        statusPrevisao = "Sem previsão";
      }

      return {
        'Status Recebimento': mov.paid ? 'Sim' : 'Não',
        'Nome da Receita': mov.group_name,
        'Valor': Number(mov.value),
        'Previsão/Recebimento': statusPrevisao,
        'Data Prevista': mov.due_date_vencimento ? formatarData(mov.due_date_vencimento) : '-',
        'Data de Recebimento': mov.paid && mov.data_pagamento ? formatarData(mov.data_pagamento) : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 }
    ];

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cell_address = {c:2, r:R};
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if(worksheet[cell_ref] && typeof worksheet[cell_ref].v === 'number'){
        worksheet[cell_ref].z = 'R$ #,##0.00';
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Receitas");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(dataBlob, `receitas_filtradas_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  return (
    <div className="container mt-5"> {/* Bootstrap: container e margem superior */}
      <h2 className="mb-4">Resumo de Receitas</h2> {/* Bootstrap: margem inferior */}

      <div className="mb-3 d-flex align-items-center gap-3"> {/* Bootstrap: margem, display flex, alinhamento, espaçamento */}
        <label htmlFor="filtroRecebidoSelect" className="form-label mb-0">Filtrar status:</label> {/* Bootstrap: form label */}
        <select
          id="filtroRecebidoSelect"
          className="form-select w-auto" /* Bootstrap: form select, largura automática */
          value={filtroRecebido}
          onChange={(e) => setFiltroRecebido(e.target.value)}
        >
          <option value="todos">Todas</option>
          <option value="recebidos">Recebidas</option>
          <option value="nao-recebidos">Não Recebidas</option>
        </select>
      </div>

      <div className="mb-3"> {/* Bootstrap: margem inferior */}
        <button 
          onClick={handleExportExcel} 
          className="btn btn-success" /* Bootstrap: botão verde */
          disabled={dadosFiltrados.length === 0}
        >
          <i className="bi bi-file-earmark-excel me-2"></i> {/* Bootstrap Icon e margem direita */}
          Exportar para Excel
        </button>
      </div>

      {/* Resumo de Receitas com classes Bootstrap para layout e cores */}
      <div className="bg-light p-3 rounded d-flex flex-wrap justify-content-between mb-4 border">
        <div className="me-3 mb-2">
          <strong>{dadosFiltrados.length}</strong> no total<br />
          <span className="text-muted">{formatarValor(totalReceitas)}</span>
        </div>
        <div className="me-3 mb-2 text-warning"> {/* Bootstrap: cor do texto */}
          <strong>{aReceberVencidas.length}</strong> Previsão Vencida<br />
          <span>{formatarValor(aReceberVencidas.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="me-3 mb-2 text-success"> {/* Bootstrap: cor do texto */}
          <strong>{recebidas.length}</strong> Recebida(s)<br />
          <span>{formatarValor(recebidas.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="me-3 mb-2">
          <strong>{aReceber.length}</strong> A Receber<br />
          <span>{formatarValor(aReceber.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
      </div>

      {/* Tabela com classes Bootstrap */}
      <div className="table-responsive"> {/* Bootstrap: tabela responsiva */}
        <table className="table table-bordered table-hover align-middle"> {/* Bootstrap: classes de tabela */}
          <thead className="table-light"> {/* Bootstrap: cabeçalho claro */}
            <tr>
              <th>Recebido</th>
              <th>Nome da Receita</th>
              <th>Valor</th>
              <th>Previsão/Recebimento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">Nenhuma receita encontrada.</td> {/* Bootstrap: texto centralizado */}
              </tr>
            )}
            {dadosFiltrados.map((mov) => (
              <tr key={mov.id}>
                <td className="text-center"> {/* Bootstrap: texto centralizado */}
                  <div className="form-check form-switch d-flex justify-content-center"> {/* Bootstrap: switch e centralização */}
                    <input
                      className="form-check-input" /* Bootstrap: input do switch */
                      type="checkbox"
                      role="switch"
                      id={`switch-receita-${mov.id}`}
                      checked={mov.paid || false}
                      disabled={loadingUpdate}
                      onChange={() => toggleRecebido(mov.id, mov.paid)}
                    />
                  </div>
                </td>
                <td>{mov.group_name}</td>
                <td className="fw-bold text-success">{/* Bootstrap: negrito e cor do texto */}
                  {formatarValor(mov.value)}
                </td>
                <td
                  className={ /* Classes Bootstrap dinâmicas para cor do texto */
                    mov.paid
                      ? "text-success"
                      : (mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')))
                      ? "text-danger"
                      : "text-warning"
                  }
                >
                  {mov.paid ? (
                    <>
                      Recebido em <br/> <strong>{formatarData(mov.data_pagamento)}</strong>
                    </>
                  ) : mov.due_date_vencimento ? (
                     dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')) ? (
                      <>
                        Previsão Vencida <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong>
                      </>
                     ) : (
                      <>
                        Previsto para <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong>
                      </>
                     )
                  ) : (
                    "Aguardando recebimento"
                  )}
                </td>
                <td className="text-center"> {/* Bootstrap: texto centralizado */}
                  <Link
                    to={`/Form_Rec_Des/${mov.id}`}
                    className="btn btn-sm btn-outline-secondary" /* Bootstrap: botão pequeno e estilizado */
                  >
                    <i className="bi bi-pencil-square"></i> Editar {/* Bootstrap Icon */}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}