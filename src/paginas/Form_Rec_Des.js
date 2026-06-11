import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import Api from "../servico/Api";

export default function FormRecDes() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados dos campos
  const [type, setType] = useState("");
  const [group_name, setGroupName] = useState("");
  const [valor, setValor] = useState("");
  const [paid, setPaid] = useState(false);

  const [categoriaId, setCategoriaId] = useState("");
  const [meioPagamentoId, setMeioPagamentoId] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [meiosPagamento, setMeiosPagamento] = useState([]);

  const [dataLancamento, setDataLancamento] = useState("");
  const [dueDateVencimento, setDueDateVencimento] = useState("");

  const voltar = () => navigate("/");

  // Carregar dados e listas
  useEffect(() => {
    const init = async () => {
      await carregarListas();
      if (id) await carregarDados();
      setCarregando(false);
    };
    init();
  }, [id]);

  const carregarListas = async () => {
    try {
      const [catRes, meioRes] = await Promise.all([
        Api.api.get("/categorias"),
        Api.api.get("/meios-pagamento"),
      ]);
      setCategorias(catRes.data);
      setMeiosPagamento(meioRes.data);
    } catch {
      alert("Erro ao carregar categorias ou meios de pagamento");
    }
  };

  const carregarDados = async () => {
    try {
      const { data } = await Api.api.get(`/movimentacoes/${id}`);

      setType(data.type || "");
      setGroupName(data.group_name || "");
      setValor(data.valor != null ? String(data.valor) : "");
      setPaid(!!data.paid);

      setCategoriaId(data.categoria_id || "");
      setMeioPagamentoId(data.meio_pagamento_id || "");

      setDataLancamento(
        data.data_lancamento
          ? dayjs(data.data_lancamento).format("YYYY-MM-DD")
          : ""
      );

      setDueDateVencimento(
        data.due_date_vencimento
          ? dayjs(data.due_date_vencimento).format("YYYY-MM-DD")
          : ""
      );
    } catch {
      alert("Erro ao carregar dados");
    }
  };

  // Salvar
  const salvar = async () => {
    if (salvando) return;

    if (!type || !group_name || !valor || !categoriaId || !meioPagamentoId) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setSalvando(true);

    const dados = {
      type,
      group_name,
      valor: parseFloat(valor),
      paid,
      categoria_id: categoriaId,
      meio_pagamento_id: meioPagamentoId,
      data_lancamento: dataLancamento || dayjs().format("YYYY-MM-DD"),
      due_date_vencimento: dueDateVencimento || null,
    };

    try {
      if (id) {
        await Api.api.put(`/movimentacoes/${id}`, dados);
      } else {
        await Api.api.post("/movimentacoes", dados);
      }
      voltar();
    } catch {
      alert("Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  // Excluir
  const excluir = async () => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
      try {
        await Api.api.delete(`/movimentacoes/${id}`);
        voltar();
      } catch (erro) {
        console.error("Erro ao excluir:", erro);
        alert("Erro ao excluir o registro. Verifique o console.");
      }
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "700px" }}>
      <div className="card shadow-sm">
        {/* Cabeçalho igual ao da imagem */}
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">{id ? "Editar Lançamento" : "Novo Lançamento"}</h4>
        </div>
        
        <div className="card-body">
          {carregando ? (
            <p className="text-center mt-3">Carregando...</p>
          ) : (
            <form>
              {/* LINHA 1: Tipo e Meio de Pagamento */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Receita ou Despesa</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Receita">Receita</option>
                    <option value="Despesa">Despesa</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Meio de Pagamento</label>
                  <select
                    className="form-select"
                    value={meioPagamentoId}
                    onChange={(e) => setMeioPagamentoId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {meiosPagamento.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LINHA 2: Categoria e Valor */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
              </div>

              {/* LINHA 3: Descrição */}
              <div className="mb-3">
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  className="form-control"
                  value={group_name}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* LINHA 4: Datas */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Data do Lançamento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataLancamento}
                    onChange={(e) => setDataLancamento(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Data de Vencimento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dueDateVencimento}
                    onChange={(e) => setDueDateVencimento(e.target.value)}
                  />
                </div>
              </div>

              {/* Checkbox de despesa paga */}
              {type === "Despesa" && (
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="paid"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                  />
                  <label htmlFor="paid" className="form-check-label">
                    Despesa paga
                  </label>
                </div>
              )}
            </form>
          )}
        </div>

        {/* RODAPÉ: Botões alinhados à direita */}
        <div className="card-footer text-end">
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={salvar}
            disabled={salvando || carregando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={voltar}
          >
            Cancelar
          </button>

          {id && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={excluir}
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}