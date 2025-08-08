import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as XLSX from 'xlsx'; // Importa a biblioteca xlsx
import { saveAs } from 'file-saver'; // Importa a biblioteca file-saver
import Api from "../servico/Api";
import cookie from "js-cookie";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
  const [dados, setDados] = useState([]);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [filtroPago, setFiltroPago] = useState("todos");
  const [nome, setNome] = useState("");

  const listar = async () => {
    try {
      const { data } = await Api.api.get("/movimentacoes");
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
    }
  };
  const carregarUsuario = async () => {
    const token = cookie.get("token"); // ou o nome do seu cookie de token
    if (!token) {
      setNome(""); // Sem token, limpa nome
      return;
    }

     try {
      // Supondo que a API tenha um endpoint para obter o usuário logado:
      const { data } = await Api.api.get("/usuarios/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNome(data.nome); // Ajuste conforme o retorno da API
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      setNome("");
    }
  };

  useEffect(() => {
    listar();
    carregarUsuario();
  }, []);

  const formatarData = (dataISO) => {
    if (!dataISO) return "-";
    // Considera que a dataISO pode já estar no fuso horário correto ou ser UTC
    // Para consistência, pode-se converter para o fuso local antes de formatar se necessário
    return dayjs(dataISO).tz(dayjs.tz.guess()).format("DD/MM/YYYY");
  };

  const formatarValor = (valor) => {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const togglePago = async (id, pagoAtual) => {
    setLoadingUpdate(true);
    try {
      await Api.api.put(`/movimentacoes/${id}`, {
        paid: !pagoAtual,
      });
      await listar(); // Recarrega os dados para refletir a mudança
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      alert("Erro ao atualizar status de pagamento.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const dadosFiltrados = dados
    .filter((d) => d.type === "Despesa")
    .filter((d) => {
      if (filtroPago === "pagos") return d.paid === true;
      if (filtroPago === "nao-pagos") return d.paid === false;
      return true;
    });

  const totalDespesas = dadosFiltrados.reduce(
    (acc, curr) => acc + Number(curr.value),
    0
  );

  const atrasados = dadosFiltrados.filter(
    (d) => !d.paid && dayjs(d.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))
  );

  const pagos = dadosFiltrados.filter((d) => d.paid);
  const aPagar = dadosFiltrados.filter((d) => !d.paid);

  // Função para exportar para Excel
  const handleExportExcel = () => {
    // Prepara os dados para a planilha
    const dadosParaExportar = dadosFiltrados.map(mov => {
      let statusVencimento = "";
      if (mov.paid) {
        statusVencimento = `Pago em ${formatarData(mov.data_pagamento)}`;
      } else if (dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))) {
        statusVencimento = `Venceu em ${formatarData(mov.due_date_vencimento)}`;
      } else {
        statusVencimento = `Vence em ${formatarData(mov.due_date_vencimento)}`;
      }

      return {
        'Pago': mov.paid ? 'Sim' : 'Não',
        'Nome do Gasto': mov.group_name,
        'Valor': Number(mov.value), // Exportar como número para o Excel
        'Vencimento/Pagamento': statusVencimento,
        'Data de Vencimento': mov.due_date_vencimento ? formatarData(mov.due_date_vencimento) : '-',
        'Data de Pagamento': mov.paid && mov.data_pagamento ? formatarData(mov.data_pagamento) : '-'
      };
    });

    // Cria a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);

    // Define a largura das colunas (opcional, para melhor visualização)
    // As larguras são aproximadas em número de caracteres
    worksheet['!cols'] = [
      { wch: 8 },  // Pago
      { wch: 30 }, // Nome do Gasto
      { wch: 15 }, // Valor (será formatado no Excel)
      { wch: 25 }, // Vencimento/Pagamento
      { wch: 20 }, // Data de Vencimento
      { wch: 20 }  // Data de Pagamento
    ];
    
    // Formata a coluna 'Valor' como moeda BRL no Excel
    // Para isso, precisamos iterar sobre as células da coluna de valor
    // A coluna 'Valor' é a C (índice 2 na exportação baseada em objeto)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) { // +1 para pular o header
      const cell_address = {c:2, r:R}; // Coluna C
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if(worksheet[cell_ref] && typeof worksheet[cell_ref].v === 'number'){
        worksheet[cell_ref].z = 'R$ #,##0.00'; // Formato de moeda BRL
      }
    }

    // Cria o workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");

    // Gera o buffer do arquivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Cria o Blob e inicia o download
    const dataBlob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(dataBlob, `despesas_filtradas_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  return (
    <div className="container mt-5 position-relative">

  {/* Texto no canto superior direito */}
  
    <div className="position-absolute top-0 end-0 p-3 fw-bold fs-3 text-dark">
    {nome ? `Bem-vindo, ${nome}` : ""}
  </div>
      <h2 className="mb-4">Resumo de Despesas</h2>

      <div className="mb-3 d-flex align-items-center gap-3">
        <label htmlFor="filtroPagoSelect" className="form-label mb-0">Filtrar pagamento:</label>
        <select
          id="filtroPagoSelect"
          className="form-select w-auto"
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pagos">Pagos</option>
          <option value="nao-pagos">Não pagos</option>
        </select>
      </div>

      {/* Botão de Exportar */}
      <div className="mb-3">
        <button onClick={handleExportExcel} className="btn btn-success">
          <i className="bi bi-file-earmark-excel me-2"></i>Exportar para Excel
        </button>
      </div>

      <div className="bg-light p-3 rounded d-flex flex-wrap justify-content-between mb-4 border">
        <div className="me-3 mb-2">
          <strong>{dadosFiltrados.length}</strong> no total<br />
          <span className="text-muted">{formatarValor(totalDespesas)}</span>
        </div>
        <div className="me-3 mb-2 text-danger">
          <strong>{atrasados.length}</strong> Atrasado(s)<br />
          <span>{formatarValor(atrasados.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="me-3 mb-2 text-success">
          <strong>{pagos.length}</strong> pago(s)<br />
          <span>{formatarValor(pagos.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="me-3 mb-2">
          <strong>{aPagar.length}</strong> a pagar<br />
          <span>{formatarValor(aPagar.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Pago</th>
              <th>Nome do gasto</th>
              <th>Valor</th>
              <th>Vencimento/Pagamento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">Nenhuma despesa encontrada.</td>
              </tr>
            )}
            {dadosFiltrados.map((mov) => (
              <tr key={mov.id}>
                <td className="text-center">
                  <div className="form-check form-switch d-flex justify-content-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id={`switch-${mov.id}`}
                      checked={mov.paid || false}
                      disabled={loadingUpdate}
                      onChange={() => togglePago(mov.id, mov.paid)}
                    />
                  </div>
                </td>
                <td>{mov.group_name}</td>
                <td className="fw-bold text-danger">{formatarValor(mov.value)}</td>
                <td
                  className={
                    mov.paid
                      ? "text-success"
                      : dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))
                      ? "text-danger"
                      : ""
                  }
                >
                  {mov.paid ? (
                    <>
                      Pago em <br/> <strong>{formatarData(mov.data_pagamento)}</strong>
                    </>
                  ) : dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')) ? (
                    <>
                      Venceu em <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong>
                    </>
                  ) : (
                    <>
                      Vence em <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong>
                    </>
                  )}
                </td>
                <td className="text-center">
                  <Link
                    to={`/Form_Rec_Des/${mov.id}`}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <i className="bi bi-pencil-square"></i> Editar
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