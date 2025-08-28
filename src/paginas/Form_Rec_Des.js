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

  // Estados dos campos
  const [type, setType] = useState("");
  const [group_name, setGroupName] = useState("");
  const [value, setValue] = useState("");
  const [paid, setPaid] = useState(false);  // Estado para despesa paga
  const [dueDateVencimento, setDueDateVencimento] = useState(""); // Estado para data de vencimento

  // Voltar para a lista
  const voltar = () => {
    navegacao("/");
  };

  // Salvar (inserir ou atualizar)
  const salvar = async () => {
    const dados = {
      type,
      group_name,
      value: parseFloat(value),
      paid,
      due_date_vencimento: dueDateVencimento || null, // envia null se vazio
    };

    try {
      if (id) {
        // Atualização
        await Api.api.put(`/movimentacoes/${id}`, dados);
      } else {
        // Criação
        await Api.api.post("/movimentacoes", dados);
      }
      voltar();
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert("Erro ao salvar os dados. Verifique o console.");
    }
  };

  // Excluir registro
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

  // Carregar dados para edição
  useEffect(() => {
    if (id) {
      Api.api.get(`/movimentacoes/${id}`)
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
        })
        .catch((erro) => {
          console.error("Erro ao carregar dados:", erro);
          alert("Erro ao carregar dados para edição.");
        });
    }
  }, [id]);

  return (
    <div style={{ marginLeft: "60px", padding: "20px" }}>
      <h1>Receita ou Despesa</h1>

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
        <div className="mb-3">
          <label htmlFor="tipoMov" className="form-label">
            Receita ou Despesa
          </label>
          <select
            id="tipoMov"
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="grupo" className="form-label">
            Tipo
          </label>
          <input
            type="text"
            id="grupo"
            className="form-control"
            value={group_name}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="mb-3">
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

        {/* Campo Data de Vencimento */}
        <div className="mb-3">
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

        {/* Exibe checkbox só se for despesa */}
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

        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={salvar}
        >
          Salvar
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
      </form>
    </div>
  );
}


