import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Api from "../servico/Api";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function FormRecDes() {
  const navegacao = useNavigate();
  const { id } = useParams();
  const [salvando, setSalvando] = useState(false);

  // Estados dos campos
  const [type, setType] = useState("");
  const [group_name, setGroupName] = useState("");
  const [value, setValue] = useState("");
  const [paid, setPaid] = useState(false);
  const [dueDateVencimento, setDueDateVencimento] = useState("");
  const [dataLancamento, setDataLancamento] = useState("");

  // Voltar
  const voltar = () => navegacao("/");

  // Salvar
  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);

    const dados = {
      type,
      group_name,
      value: parseFloat(value),
      paid,
      due_date_vencimento: dueDateVencimento || null,
      data_lancamento: dataLancamento || dayjs().format("YYYY-MM-DD"),
    };

    try {
      if (id) {
        await Api.api.put(`/movimentacoes/${id}`, dados);
      } else {
        await Api.api.post("/movimentacoes", dados);
      }
      voltar();
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert("Erro ao salvar os dados. Verifique o console.");
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

  // Carregar dados
  useEffect(() => {
    if (id) {
      Api.api
        .get(`/movimentacoes/${id}`)
        .then((response) => {
          const mov = response.data;
          setType(mov.type || "");
          setGroupName(mov.group_name || "");
          setValue(mov.value != null ? String(mov.value) : "");
          setPaid(mov.paid || false);
          setDueDateVencimento(
            mov.due_date_vencimento
              ? dayjs(mov.due_date_vencimento).format("YYYY-MM-DD")
              : ""
          );
          setDataLancamento(
            mov.data_lancamento
              ? dayjs(mov.data_lancamento).format("YYYY-MM-DD")
              : ""
          );
        })
        .catch((erro) => {
          console.error("Erro ao carregar dados:", erro);
          alert("Erro ao carregar dados para edição.");
        });
    }
  }, [id]);

  return (
    <div className="container mt-4" style={{ maxWidth: "700px" }}>
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">{id ? "Editar Lançamento" : "Novo Lançamento"}</h4>
        </div>
        <div className="card-body">
          <form>
            {id && (
              <div className="mb-3">
                <label htmlFor="codigo" className="form-label">
                  Código
                </label>
                <input
                  type="text"
                  id="codigo"
                  className="form-control"
                  value={id || ""}
                  readOnly
                />
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="tipoMov" className="form-label">
                  Receita ou Despesa
                </label>
                <select
                  id="tipoMov"
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
                <label htmlFor="valor" className="form-label">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="valor"
                  className="form-control"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="grupo" className="form-label">
                Descrição
              </label>
              <input
                type="text"
                id="grupo"
                className="form-control"
                value={group_name}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="dataLancamento" className="form-label">
                  Data do Lançamento
                </label>
                <input
                  type="date"
                  id="dataLancamento"
                  className="form-control"
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="dueDateVencimento" className="form-label">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  id="dueDateVencimento"
                  className="form-control"
                  value={dueDateVencimento}
                  onChange={(e) => setDueDateVencimento(e.target.value)}
                />
              </div>
            </div>

            {type === "Despesa" && (
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  id="paid"
                  className="form-check-input"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                />
                <label htmlFor="paid" className="form-check-label">
                  Despesa paga
                </label>
              </div>
            )}
          </form>
        </div>

        <div className="card-footer text-end">
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={salvar}
            disabled={salvando}
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