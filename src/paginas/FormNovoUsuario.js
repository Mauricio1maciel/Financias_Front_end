import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../servico/Api";
import cookie from "js-cookie";

export default function FormNovoUsuario() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true); // controle de carregamento

  // Validação de permissão
  useEffect(() => {
    const token = cookie.get("token");

    Api.api.get("/usuarios/me", {
      headers: { token }
    })
    .then(res => {
      if (res.data.email !== "macielmauriciio@gmail.com") {
        setMensagem("Acesso negado. Somente administradores podem cadastrar usuários.");
        setTimeout(() => navigate("/"), 3000); // Redireciona após 3s
      } else {
        setCarregando(false); // Libera a tela
      }
    })
    .catch(err => {
      console.error(err);
      setMensagem("Erro ao verificar permissões.");
      setTimeout(() => navigate("/"), 3000);
    });
  }, []);

  const cadastrar = async () => {
    const token = cookie.get("token");

    if (!nome || !email || !senha) {
      setMensagem("Todos os campos são obrigatórios.");
      return;
    }

    if (senha.length < 6 || senha.length > 20) {
      setMensagem("A senha deve ter entre 6 e 20 caracteres.");
      return;
    }

    try {
      const resposta = await Api.api.post("/usuarios", {
        nome, email, senha
      }, {
        headers: { token }
      });

      if (resposta.status === 201) {
        setMensagem("Usuário cadastrado com sucesso!");
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (erro) {
      console.error(erro);
      if (erro.response?.data) {
        setMensagem(erro.response.data);
      } else {
        setMensagem("Erro ao cadastrar usuário.");
      }
    }
  };

  if (carregando) {
    return <div className="text-center mt-5">Verificando permissões...</div>;
  }

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Cadastrar Novo Usuário</h2>

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

          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {mensagem && <div className="alert alert-info">{mensagem}</div>}

          <button
            type="button"
            className="btn btn-primary"
            onClick={cadastrar}
          >
            Criar Usuário
          </button>
        </div>
      </div>
    </div>
  );
}
