import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Api from "../servico/Api";
import cookie from "js-cookie";
import Select from "react-select";

// Configuração do Dayjs
dayjs.locale("pt-br");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

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

  // Filtros
  const [filtroPago, setFiltroPago] = useState("todos");
  const [mes, setMes] = useState("todos");
  const [ano, setAno] = useState(dayjs().year());
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [categorias, setCategorias] = useState([]);

  // Ordenação
  const [configOrdenacao, setConfigOrdenacao] = useState({
    chave: "due_date_vencimento",
    direcao: "descendente",
  });

  const mesesDoAno = Array.from({ length: 12 }, (_, i) => ({
    valor: i + 1,
    nome: dayjs().month(i).format("MMMM"),
  }));

  const listar = async () => {
    try {
      const { data } = await Api.api.get("/movimentacoes");
      setDados(data);

      if (data.length > 0) {
        const anos = Array.from(
          new Set(
            data.map((m) => {
              const dataRef =
                m.data_lancamento || m.data_pagamento || m.due_date_vencimento || m.created_at;
              return dataRef ? dayjs(dataRef).year() : dayjs().year();
            })
          )
        ).sort((a, b) => b - a);
        setAnosDisponiveis(anos.length > 0 ? anos : [dayjs().year()]);

        const despesas = data.filter((mov) => mov.type === "Despesa");
        const nomesUnicos = [
          ...new Set(despesas.map((item) => item.group_name.trim())),
        ].sort();
        const categoriasParaSelect = nomesUnicos.map((nome) => ({
          value: nome,
          label: nome,
        }));
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
      const { data } = await Api.api.get("/usuarios/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // --- Filtros ---
  const dadosFiltradosBase = useMemo(() => {
    return dados
      .filter((d) => d.type === "Despesa")
      .filter((d) => {
        if (!filtroCategoria) return true;
        return (
          normalizarTexto(d.group_name) ===
          normalizarTexto(filtroCategoria.value)
        );
      })
      .filter((d) => {
        if (ano === "todos" || !ano) return true;
        const dataRef = d.data_lancamento || d.data_pagamento || d.due_date_vencimento;
        return dataRef && dayjs(dataRef).year() === Number(ano);
      })
      .filter((d) => {
        if (mes === "todos" || !mes) return true;
        const dataRef = d.data_lancamento || d.data_pagamento || d.due_date_vencimento;
        return dataRef && dayjs(dataRef).month() + 1 === Number(mes);
      });
  }, [dados, filtroCategoria, ano, mes]);

  const dadosFiltradosParaTabela = useMemo(() => {
    if (filtroPago === "todos") return dadosFiltradosBase;
    return dadosFiltradosBase.filter((d) =>
      filtroPago === "pagos" ? d.paid === true : d.paid === false
    );
  }, [dadosFiltradosBase, filtroPago]);

  const dadosOrdenados = useMemo(() => {
    let dadosSensiveisAOrdenacao = [...dadosFiltradosParaTabela];
    if (configOrdenacao.chave) {
      dadosSensiveisAOrdenacao.sort((a, b) => {
        const valorA = a[configOrdenacao.chave] || "";
        const valorB = b[configOrdenacao.chave] || "";
        let comparacao = 0;
        if (configOrdenacao.chave === "value") comparacao = Number(valorA) - Number(valorB);
        else if (typeof valorA === "string" && typeof valorB === "string")
          comparacao = valorA.localeCompare(valorB, "pt-BR", { sensitivity: "base" });
        else {
          if (valorA < valorB) comparacao = -1;
          if (valorA > valorB) comparacao = 1;
        }
        return configOrdenacao.direcao === "ascendente" ? comparacao : comparacao * -1;
      });
    }
    return dadosSensiveisAOrdenacao;
  }, [dadosFiltradosParaTabela, configOrdenacao]);

  // Totais
  const atrasados = dadosFiltradosBase.filter(
    (d) =>
      !d.paid &&
      d.due_date_vencimento &&
      dayjs(d.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf("day"))
  );
  const pagos = dadosFiltradosBase.filter((d) => d.paid);
  const aPagar = dadosFiltradosBase.filter((d) => !d.paid);
  const totalDespesasVisivel = dadosOrdenados.reduce(
    (acc, curr) => acc + Number(curr.value),
    0
  );

  const solicitarOrdenacao = (chave) => {
    let direcao = "ascendente";
    if (configOrdenacao.chave === chave && configOrdenacao.direcao === "ascendente")
      direcao = "descendente";
    setConfigOrdenacao({ chave, direcao });
  };

  const IconeOrdenacao = ({ chaveColuna }) => {
    if (configOrdenacao.chave !== chaveColuna) return null;
    return configOrdenacao.direcao === "ascendente" ? <i className="bi bi-arrow-up ms-1"></i> : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const formatarData = (dataISO) => (!dataISO ? "-" : dayjs(dataISO).tz(dayjs.tz.guess()).format("DD/MM/YYYY"));
  const formatarValor = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  return (
    <div className="container mt-4">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Resumo de Despesas</h2>
        {nome && <div className="fw-bold">Bem-vindo, {nome}</div>}
      </div>

      {/* Filtros */}
      <div className="card shadow-sm mb-4">
        <div className="card-body row g-3">
          <div className="col-md-3">
            <label className="form-label fw-bold">Status</label>
            <select className="form-select" value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="pagos">Pagos</option>
              <option value="nao-pagos">Não pagos</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Categoria</label>
            <Select options={categorias} value={filtroCategoria} onChange={setFiltroCategoria} placeholder="Selecione ou digite..." isClearable isSearchable noOptionsMessage={() => "Nenhuma categoria encontrada"} />
          </div>
          <div className="col-md-2">
            <label className="form-label fw-bold">Mês</label>
            <select className="form-select" value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDoAno.map(m => <option key={m.valor} value={m.valor}>{m.nome.charAt(0).toUpperCase() + m.nome.slice(1)}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label fw-bold">Ano</label>
            <select className="form-select" value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="todos">Todos</option>
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="d-flex flex-wrap justify-content-between mb-4">
        <div className="p-3 bg-light rounded shadow-sm me-2 mb-2 text-center flex-fill">
          <strong>{dadosOrdenados.length}</strong><br />Visíveis<br /><span className="text-muted">{formatarValor(totalDespesasVisivel)}</span>
        </div>
        <div className="p-3 bg-light rounded shadow-sm me-2 mb-2 text-center flex-fill text-danger">
          <strong>{atrasados.length}</strong><br />Atrasado(s)<br /><span>{formatarValor(atrasados.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="p-3 bg-light rounded shadow-sm me-2 mb-2 text-center flex-fill text-success">
          <strong>{pagos.length}</strong><br />Pago(s)<br /><span>{formatarValor(pagos.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
        <div className="p-3 bg-light rounded shadow-sm me-2 mb-2 text-center flex-fill">
          <strong>{aPagar.length}</strong><br />A pagar<br /><span>{formatarValor(aPagar.reduce((acc, cur) => acc + Number(cur.value), 0))}</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th onClick={() => solicitarOrdenacao("paid")} style={{ cursor: "pointer" }}>Pago <IconeOrdenacao chaveColuna="paid" /></th>
              <th onClick={() => solicitarOrdenacao("group_name")} style={{ cursor: "pointer" }}>Nome do gasto <IconeOrdenacao chaveColuna="group_name" /></th>
              <th onClick={() => solicitarOrdenacao("value")} style={{ cursor: "pointer" }}>Valor <IconeOrdenacao chaveColuna="value" /></th>
              <th onClick={() => solicitarOrdenacao("due_date_vencimento")} style={{ cursor: "pointer" }}>Vencimento/Pagamento <IconeOrdenacao chaveColuna="due_date_vencimento" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dadosOrdenados.length === 0 && <tr><td colSpan="5" className="text-center">Nenhuma despesa encontrada.</td></tr>}
            {dadosOrdenados.map((mov) => (
              <tr key={mov.id}>
                <td className="text-center">
                  <div className="form-check form-switch d-flex justify-content-center">
                    <input className="form-check-input" type="checkbox" role="switch" checked={mov.paid || false} disabled={loadingUpdate} onChange={() => togglePago(mov.id, mov.paid)} />
                  </div>
                </td>
                <td>{mov.group_name}</td>
                <td className="fw-bold text-danger">{formatarValor(mov.value)}</td>
                <td className={mov.paid ? "text-success" : mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf("day")) ? "text-danger" : ""}>
                  {mov.paid ? <>Pago em <br /><strong>{formatarData(mov.data_pagamento)}</strong></> : mov.due_date_vencimento && dayjs(mov.due_date_vencimento).tz(dayjs.tz.guess()).isBefore(dayjs().startOf("day")) ? <>Venceu em <br /><strong>{formatarData(mov.due_date_vencimento)}</strong></> : mov.due_date_vencimento ? <>Vence em <br /><strong>{formatarData(mov.due_date_vencimento)}</strong></> : "Data indefinida"}
                </td>
                <td className="text-center">
                  <Link to={`/Form_Rec_Des/${mov.id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil-square"></i> Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
