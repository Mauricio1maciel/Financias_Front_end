import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Api from "../servico/Api";
import cookie from "js-cookie";
import Select from 'react-select';

// Configura o Dayjs
dayjs.locale('pt-br');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

// Função para corrigir a busca com acentos e maiúsculas/minúsculas
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function Home() {
  const [dados, setDados] = useState([]);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [nome, setNome] = useState("");

  // Estados para os filtros
  const [filtroPago, setFiltroPago] = useState("todos");
  const [mes, setMes] = useState('todos');
  const [ano, setAno] = useState(dayjs().year());
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [categorias, setCategorias] = useState([]);

  // Estado para controlar a ordenação
  const [configOrdenacao, setConfigOrdenacao] = useState({ chave: 'due_date_vencimento', direcao: 'descendente' });

  const mesesDoAno = Array.from({ length: 12 }, (_, i) => ({
    valor: i + 1,
    nome: dayjs().month(i).format('MMMM'),
  }));

  const listar = async () => {
    try {
      const { data } = await Api.api.get("/movimentacoes");
      setDados(data);

      if (data.length > 0) {
        const anos = Array.from(new Set(data.map(m => {
          const dataRef = m.data_pagamento || m.due_date_vencimento || m.created_at;
          return dataRef ? dayjs(dataRef).year() : dayjs().year();
        }))).sort((a, b) => b - a);
        setAnosDisponiveis(anos.length > 0 ? anos : [dayjs().year()]);

        const despesas = data.filter(mov => mov.type === 'Despesa');
        const nomesUnicos = [...new Set(despesas.map(item => item.group_name.trim()))].sort();
        const categoriasParaSelect = nomesUnicos.map(nome => ({ value: nome, label: nome }));
        setCategorias(categoriasParaSelect);
      }
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
    }
  };

  const carregarUsuario = async () => {
    const token = cookie.get("token");
    if (!token) {
      setNome("");
      return;
    }
     try {
      const { data } = await Api.api.get("/usuarios/me", { headers: { Authorization: `Bearer ${token}` } });
      setNome(data.nome);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      setNome("");
    }
  };

  useEffect(() => {
    listar();
    carregarUsuario();
  }, []);

  // --- LÓGICA DE FILTRO CORRIGIDA ---
  // 1. Cria uma base com filtros de Categoria e Data. Esta base é usada para os cards de resumo.
  const dadosFiltradosBase = useMemo(() => {
    return dados
      .filter((d) => d.type === "Despesa")
      .filter((d) => {
        if (!filtroCategoria) return true;
        return normalizarTexto(d.group_name) === normalizarTexto(filtroCategoria.value);
      })
      .filter((d) => {
        if (ano === 'todos' || !ano) return true;
        const dataRef = d.data_pagamento || d.due_date_vencimento;
        return dataRef && dayjs(dataRef).year() === Number(ano);
      })
      .filter((d) => {
        if (mes === 'todos' || !mes) return true;
        const dataRef = d.data_pagamento || d.due_date_vencimento;
        return dataRef && (dayjs(dataRef).month() + 1) === Number(mes);
      });
  }, [dados, filtroCategoria, ano, mes]);

  // 2. Cria a lista para a TABELA, aplicando o filtro de status (pago/não pago) sobre a base
  const dadosFiltradosParaTabela = useMemo(() => {
    if (filtroPago === 'todos') {
      return dadosFiltradosBase;
    }
    return dadosFiltradosBase.filter((d) => {
      if (filtroPago === "pagos") return d.paid === true;
      if (filtroPago === "nao-pagos") return d.paid === false;
      return true;
    });
  }, [dadosFiltradosBase, filtroPago]);

  const dadosOrdenados = useMemo(() => {
    let dadosSensiveisAOrdenacao = [...dadosFiltradosParaTabela];
    if (configOrdenacao.chave) {
      dadosSensiveisAOrdenacao.sort((a, b) => {
        const valorA = a[configOrdenacao.chave] || '';
        const valorB = b[configOrdenacao.chave] || '';
        let comparacao = 0;
        if (configOrdenacao.chave === 'value') {
            comparacao = Number(valorA) - Number(valorB);
        } else if (typeof valorA === 'string' && typeof valorB === 'string') {
            comparacao = valorA.localeCompare(valorB, 'pt-BR', { sensitivity: 'base' });
        } else {
            if (valorA < valorB) comparacao = -1;
            if (valorA > valorB) comparacao = 1;
        }
        return configOrdenacao.direcao === 'ascendente' ? comparacao : comparacao * -1;
      });
    }
    return dadosSensiveisAOrdenacao;
  }, [dadosFiltradosParaTabela, configOrdenacao]);
  
  // 3. Calcula os totais dos cards usando a base (para os cards de status) e os dados da tabela (para o total visível)
  const atrasados = dadosFiltradosBase.filter((d) => !d.paid && d.due_date_vencimento && dayjs(d.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')));
  const pagos = dadosFiltradosBase.filter((d) => d.paid);
  const aPagar = dadosFiltradosBase.filter((d) => !d.paid);
  const totalDespesasVisivel = dadosOrdenados.reduce((acc, curr) => acc + Number(curr.value), 0);

  const solicitarOrdenacao = (chave) => {
    let direcao = 'ascendente';
    if (configOrdenacao.chave === chave && configOrdenacao.direcao === 'ascendente') {
      direcao = 'descendente';
    }
    setConfigOrdenacao({ chave, direcao });
  };
  
  const IconeOrdenacao = ({ chaveColuna }) => {
    if (configOrdenacao.chave !== chaveColuna) return null;
    return configOrdenacao.direcao === 'ascendente' ? <i className="bi bi-arrow-up ms-1"></i> : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return "-";
    return dayjs(dataISO).tz(dayjs.tz.guess()).format("DD/MM/YYYY");
  };

  const formatarValor = (valor) => {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const togglePago = async (id, pagoAtual) => {
    setLoadingUpdate(true);
    try {
      await Api.api.put(`/movimentacoes/${id}`, { paid: !pagoAtual });
      await listar();
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      alert("Erro ao atualizar status de pagamento.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleExportExcel = () => {
    const dadosParaExportar = dadosOrdenados.map(mov => {
      let statusVencimento = "";
      if (mov.paid) { statusVencimento = `Pago em ${formatarData(mov.data_pagamento)}`; } 
      else if (mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day'))) { statusVencimento = `Venceu em ${formatarData(mov.due_date_vencimento)}`; } 
      else if (mov.due_date_vencimento) { statusVencimento = `Vence em ${formatarData(mov.due_date_vencimento)}`; }
      return {
        'Pago': mov.paid ? 'Sim' : 'Não',
        'Nome do Gasto': mov.group_name,
        'Valor': Number(mov.value),
        'Vencimento/Pagamento': statusVencimento,
        'Data de Vencimento': mov.due_date_vencimento ? formatarData(mov.due_date_vencimento) : '-',
        'Data de Pagamento': mov.paid && mov.data_pagamento ? formatarData(mov.data_pagamento) : '-'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    worksheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cell_address = {c:2, r:R};
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if(worksheet[cell_ref] && typeof worksheet[cell_ref].v === 'number'){ worksheet[cell_ref].z = 'R$ #,##0.00'; }
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(dataBlob, `despesas_filtradas_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  return (
    <div className="container mt-4"> 
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Resumo de Despesas</h2>
        <div className="fw-bold fs-5 text-dark">{nome ? `Bem-vindo, ${nome}` : ""}</div>
      </div>

      <div className="row g-3 mb-4 p-3 border bg-light rounded align-items-center">
        <div className="col-md-3">
          <label htmlFor="filtroPagoSelect" className="form-label">Status:</label>
          <select id="filtroPagoSelect" className="form-select" value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pagos">Pagos</option>
            <option value="nao-pagos">Não pagos</option>
          </select>
        </div>
        <div className="col-md-3">
          <label htmlFor="filtroCategoriaSelect" className="form-label">Categoria:</label>
          <Select id="filtroCategoriaSelect" options={categorias} value={filtroCategoria} onChange={setFiltroCategoria} placeholder="Selecione ou digite..." isClearable={true} isSearchable={true} noOptionsMessage={() => "Nenhuma categoria encontrada"}/>
        </div>
        <div className="col-md-2">
          <label htmlFor="mesSelect" className="form-label">Mês:</label>
          <select id="mesSelect" className="form-select" value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="todos">Todos</option>
            {mesesDoAno.map(m => (<option key={m.valor} value={m.valor}>{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)}</option>))}
          </select>
        </div>
        <div className="col-md-2">
          <label htmlFor="anoSelect" className="form-label">Ano:</label>
          <select id="anoSelect" className="form-select" value={ano} onChange={(e) => setAno(e.target.value)}>
            <option value="todos">Todos</option>
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="col-md-2 align-self-end">
            <button onClick={handleExportExcel} className="btn btn-success w-100" disabled={dadosOrdenados.length === 0}><i className="bi bi-file-earmark-excel me-2"></i>Exportar</button>
        </div>
      </div>

      <div className="bg-light p-3 rounded d-flex flex-wrap justify-content-between mb-4 border">
        <div className="me-3 mb-2">
          <strong>{dadosOrdenados.length}</strong> {filtroPago !== 'todos' ? 'visíveis' : 'no total'}<br />
          <span className="text-muted">{formatarValor(totalDespesasVisivel)}</span>
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
              <th onClick={() => solicitarOrdenacao('paid')} style={{ cursor: 'pointer' }}>Pago <IconeOrdenacao chaveColuna="paid" /></th>
              <th onClick={() => solicitarOrdenacao('group_name')} style={{ cursor: 'pointer' }}>Nome do gasto <IconeOrdenacao chaveColuna="group_name" /></th>
              <th onClick={() => solicitarOrdenacao('value')} style={{ cursor: 'pointer' }}>Valor <IconeOrdenacao chaveColuna="value" /></th>
              <th onClick={() => solicitarOrdenacao('due_date_vencimento')} style={{ cursor: 'pointer' }}>Vencimento/Pagamento <IconeOrdenacao chaveColuna="due_date_vencimento" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dadosOrdenados.length === 0 && (<tr><td colSpan="5" className="text-center">Nenhuma despesa encontrada.</td></tr>)}
            {dadosOrdenados.map((mov) => (
              <tr key={mov.id}>
                <td className="text-center"><div className="form-check form-switch d-flex justify-content-center"><input className="form-check-input" type="checkbox" role="switch" id={`switch-${mov.id}`} checked={mov.paid || false} disabled={loadingUpdate} onChange={() => togglePago(mov.id, mov.paid)}/></div></td>
                <td>{mov.group_name}</td>
                <td className="fw-bold text-danger">{formatarValor(mov.value)}</td>
                <td className={mov.paid ? "text-success" : mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')) ? "text-danger" : ""}>
                  {mov.paid ? (<>Pago em <br/> <strong>{formatarData(mov.data_pagamento)}</strong></>) : mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf('day')) ? (<>Venceu em <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong></>) : mov.due_date_vencimento ? (<>Vence em <br/> <strong>{formatarData(mov.due_date_vencimento)}</strong></>) : "Data indefinida"}
                </td>
                <td className="text-center"><Link to={`/Form_Rec_Des/${mov.id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil-square"></i> Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}