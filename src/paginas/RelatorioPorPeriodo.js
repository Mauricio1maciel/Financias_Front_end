import React, { useState, useEffect } from "react";
import Api from "../servico/Api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import cookie from "js-cookie";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RelatorioPeriodo() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const token = cookie.get("token");

  async function carregarMovimentacoes() {
    let dataInicio = inicio;
    let dataFim = fim;

    // 👉 Se o usuário não selecionar nada, usa o mês atual
    if (!inicio || !fim) {
      const hoje = dayjs();
      dataInicio = hoje.startOf("month").format("YYYY-MM-DD");
      dataFim = hoje.endOf("month").format("YYYY-MM-DD");
    }

    try {
      const resposta = await Api.api.get(
        `/movimentacoes/periodo?inicio=${dataInicio}&fim=${dataFim}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMovimentacoes(resposta.data);
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    }
  }

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  // 👉 Função para exportar PDF
function exportarPDF() {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");

  const titulo = "Relatório de Receitas e Despesas";
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(titulo, pageWidth / 2, 20, { align: "center" });

  let periodoTexto = inicio && fim
    ? `Período: ${dayjs(inicio).format("DD/MM/YYYY")} até ${dayjs(fim).format("DD/MM/YYYY")}`
    : `Período: ${dayjs().startOf("month").format("DD/MM/YYYY")} até ${dayjs().endOf("month").format("DD/MM/YYYY")}`;
  doc.setFontSize(11);
  doc.text(periodoTexto, 14, 28);

  // Separar receitas e despesas pelo valor
  const receitas = movimentacoes.filter(m => m.type === "Receita"); 
  const despesas = movimentacoes.filter(m => m.type === "Despesa"); 

  const formatarValor = (v) => `R$ ${Math.abs(Number(v)).toFixed(2)}`;

  // Estilo alternado: linhas claras e levemente escuras
  const linhaClara = { fillColor: [255, 255, 255] };     // branco
  const linhaEscura = { fillColor: [240, 240, 240] };    // cinza claro

// --- TABELA DE RECEITAS ---
autoTable(doc, {
  startY: 35,
  head: [["Data", "Descrição", "Valor", "Recebeu"]],
  body: receitas.map(m => [
    dayjs(m.data_lancamento).format("DD/MM/YYYY"),
    m.group_name,
    formatarValor(m.value),
    m.paid ? "Sim" : "Não"
  ]),
  foot: [
    [
      { content: "TOTAL RECEITAS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      formatarValor(receitas.reduce((acc, m) => acc + Number(m.value), 0)),
      ""
    ]
  ],
  styles: { fontSize: 10, textColor: [0,0,0], lineColor: [0,0,0] },  // <- texto e borda pretos
  headStyles: { fontStyle: "bold", halign: "center", textColor: [0,0,0], fillColor: [255,255,255] }, // cabeçalho preto/branco
  footStyles: { fontStyle: "bold", halign: "right", textColor: [0,0,0], fillColor: [255,255,255] }, // rodapé preto/branco
  theme: "grid",
  alternateRowStyles: linhaEscura,
});

  // --- TABELA DE DESPESAS ---
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Descrição", "Valor", "Pago"]],
    body: despesas.map(m => [
      dayjs(m.data_lancamento).format("DD/MM/YYYY"),
      m.group_name,
      formatarValor(m.value),
      m.paid ? "Sim" : "Não"
    ]),
    foot: [
      [
        { content: "TOTAL DESPESAS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
        formatarValor(despesas.reduce((acc, m) => acc + Number(m.value), 0)),
        ""
      ]
    ],
    styles: { fontSize: 10 , textColor: [0,0,0], lineColor: [0,0,0]},
    headStyles: { fontStyle: "bold", halign: "center" , textColor: [0,0,0], fillColor: [255,255,255] },
    footStyles: { fontStyle: "bold", halign: "right",textColor: [0,0,0], fillColor: [255,255,255] },
    theme: "grid",
    alternateRowStyles: linhaEscura,
  });

  // --- RESULTADO FINAL ---
  const totalReceitas = receitas.reduce((acc, m) => acc + Number(m.value), 0);
  const totalDespesas = despesas.reduce((acc, m) => acc + Number(m.value), 0);
  const resultado = totalReceitas - totalDespesas;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // preto
  doc.text(`Resultado do Período: R$ ${resultado.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 15);

  doc.save("Relatorio.pdf");
}


  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📊 Relatório de Movimentações</h2>

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-3">
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-md-6 d-flex gap-2">
          <button
            onClick={carregarMovimentacoes}
            className="btn btn-primary"
          >
            Buscar
          </button>
          <button
            onClick={exportarPDF}
            className="btn btn-success"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-secondary">
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.length > 0 ? (
              movimentacoes.map((mov) => (
                <tr key={mov.id}>
                  <td>{dayjs(mov.data_lancamento).format("DD/MM/YYYY")}</td>
                  <td>{mov.group_name}</td>
                  <td>R$ {Number(mov.value).toFixed(2)}</td>
                  <td>{mov.paid ? "Sim" : "Não"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  Nenhuma movimentação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
