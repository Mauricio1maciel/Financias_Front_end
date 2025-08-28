import { useState } from "react";
import { useNavigate } from "react-router-dom";
import cookie from "js-cookie";
import Api from "../servico/Api";

export default function FormTrocarSenha() {
  const navigate = useNavigate();
  
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirmada, setSenhaConfirmada] = useState('');
  const [mensagem, setMensagem] = useState('');

  const definirNovaSenha = async () => {
    const token = cookie.get("token");

    if (!token) {
      setMensagem("Usuário não autenticado.");
      return;
    }

    if (senhaNova.length < 6 || senhaNova.length > 20) {
      setMensagem("A senha deve ter entre 6 e 20 caracteres.");
      return;
    }

    if (senhaNova !== senhaConfirmada) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    try {
      const resposta = await Api.api.put(
        `/senhausuarios`,
        { senha: senhaNova },
        { headers: { token: token } } // <-- envia o token aqui
      );

      if (resposta.status === 200) {
        setMensagem("Senha atualizada com sucesso! Redirecionando...");
        setSenhaNova('');
        setSenhaConfirmada('');

        // Redireciona após 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar senha.");
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4 w-100" style={{ maxWidth: "500px" }}>
        <h2 className="text-center mb-4">Alterar Senha</h2>

        <div className="mb-3">
          <label className="form-label">Nova senha</label>
          <input
            type="password"
            className="form-control"
            value={senhaNova}
            onChange={(e) => setSenhaNova(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirmar nova senha</label>
          <input
            type="password"
            className="form-control"
            value={senhaConfirmada}
            onChange={(e) => setSenhaConfirmada(e.target.value)}
          />
        </div>

        {mensagem && <div className="alert alert-info">{mensagem}</div>}

        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={definirNovaSenha}
        >
          Alterar senha
        </button>
      </div>
    </div>
  );
}
