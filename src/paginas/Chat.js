import React, { useState } from "react";
import Api from "../servico/Api";
import cookie from "js-cookie";
import ReactMarkdown from "react-markdown";

export default function ChatFinancas() {
  const [pergunta, setPergunta] = useState("");
  const [mensagens, setMensagens] = useState([]); 
  const [loading, setLoading] = useState(false);

  const token = cookie.get("token");

  async function enviarPergunta(e) {
    e.preventDefault();
    if (!pergunta.trim()) return;

    const perguntaAtual = pergunta;
    setPergunta("");
    setLoading(true);

    // adiciona a pergunta do usuário no chat
    setMensagens((prev) => [
      ...prev,
      { tipo: "usuario", texto: perguntaAtual },
    ]);

    try {
      const res = await Api.api.post(
        "/chat",
        { pergunta: perguntaAtual },
        { headers: { token } }
      );

      const data = res.data;
      const respostaIA = data.resposta || "Não foi possível obter resposta.";

      // adiciona a resposta da IA
      setMensagens((prev) => [
        ...prev,
        { tipo: "ia", texto: respostaIA },
      ]);
    } catch (err) {
      console.error(err);
      setMensagens((prev) => [
        ...prev,
        { tipo: "ia", texto: "Erro ao se comunicar com o backend." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // componente para renderizar markdown da IA
  function RespostaIA({ texto }) {
    return <ReactMarkdown>{texto}</ReactMarkdown>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-body">
          <h4 className="card-title mb-3">Chat de Finanças</h4>

          {/* Área das mensagens */}
          <div
            className="border rounded p-3 mb-3"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {mensagens.map((msg, idx) => (
              <div
                key={idx}
                className={`d-flex mb-2 ${
                  msg.tipo === "usuario"
                    ? "justify-content-end"
                    : "justify-content-start"
                }`}
              >
                <div
                  className={`p-2 rounded ${
                    msg.tipo === "usuario"
                      ? "bg-primary text-white"
                      : "bg-light"
                  }`}
                  style={{ maxWidth: "70%" }}
                >
                  {msg.tipo === "ia" ? (
                    <RespostaIA texto={msg.texto} />
                  ) : (
                    msg.texto
                  )}
                </div>
              </div>
            ))}

            {/* Mostra mensagem temporária enquanto espera resposta da IA */}
            {loading && (
              <div className="d-flex justify-content-start mb-2">
                <div
                  className="p-2 rounded bg-light"
                  style={{ maxWidth: "70%", fontStyle: "italic" }}
                >
                  A IA está analisando sua pergunta...
                </div>
              </div>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={enviarPergunta} className="d-flex gap-2">
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              className="form-control"
              placeholder="Digite sua pergunta sobre finanças"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
