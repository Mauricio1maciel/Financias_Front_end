import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Api from "../servico/Api";
import cookie from "js-cookie";

export default function FormEditarUsuario() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [emailUsuarioLogado, setEmailUsuarioLogado] = useState('');

  useEffect(() => {
    const token = cookie.get("token");
    Api.api.get("/usuarios/me", {
      headers: { token }
    })
    .then(res => {
      setNome(res.data.nome);
      setEmail(res.data.email);
      setEmailUsuarioLogado(res.data.email);
    })
    .catch(err => {
      console.error(err);
      setMensagem("Erro ao carregar dados do usuário.");
    });
  }, []);

  const salvar = async () => {
    const token = cookie.get("token");

    if (!nome || !email) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    try {
      const resposta = await Api.api.put("/usuarios/me", { nome, email }, {
        headers: { token }
      });

      if (resposta.status === 200) {
        setMensagem("Dados atualizados com sucesso!");
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar os dados.");
    }
  };

  function sair() {
    cookie.remove("token");
    navigate("/login");
  }

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4 w-100" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-4">Editar Dados do Usuário</h3>

        <div className="mb-3">
          <label className="form-label">Nome</label>
          <input
            type="text"
            className="form-control"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mensagem && (
          <div className="alert alert-info text-center">{mensagem}</div>
        )}

        <div className="d-flex flex-wrap justify-content-between gap-2 mt-3">
          <button
            type="button"
            className="btn btn-success flex-fill"
            onClick={salvar}
          >
            Salvar
          </button>

          <Link
            to="/trocarsenha"
            className="btn flex-fill"
            style={{ backgroundColor: '#FF5733', color: 'white' }}
          >
            Alterar Senha
          </Link>

          {emailUsuarioLogado === "macielmauriciio@gmail.com" && (
            <Link
              to="/novousuario"
              className="btn flex-fill"
              style={{ backgroundColor: '#0000FF', color: 'white' }}
            >
              Novo Usuário
            </Link>
          )}

          <button
            className="btn btn-danger flex-fill"
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
