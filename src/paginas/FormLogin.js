import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react"
import cookie from "js-cookie";
import Api from "../servico/Api";


export default function FormLogin(){
    const navegacao = useNavigate();
    
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
        const [erro, setErro] = useState(''); // estado para mensagem de erro

    const login = async () => {
        let body = {
            "senha": senha,
            "email": email
        };

        try{
        const resposta = await Api.api.put('/usuarios/login',body);
        if(resposta.status === 200){
           const token = resposta.data;
           cookie.set('token', token);
             Api.setTokenAxios();
           navegacao('/');
        }
        }
        catch (erro) {
            if (erro.response && (erro.response.status === 401 || erro.response.status === 404)) {
                setErro("E-mail ou senha inválidos.");
            } else {
                setErro("Erro ao tentar fazer login. Tente novamente.");
            }
            
        }
    }

    return(
        <>
    <div className="container vh-100 d-flex justify-content-center align-items-center">
        <div className="w-100" style={{ maxWidth: "400px" }}>
            <h1 className="text-center mb-4">Login</h1>
            
            <form>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                       E-mail
                    </label>
                    <input
                        type="text"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(evento) => setEmail(evento.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="senha" className="form-label">
                       Senha
                    </label>
                    <input
                        type="password"
                        id="senha"
                        className="form-control"
                        value={senha}
                        onChange={(evento) => setSenha(evento.target.value)}
                    />
                </div>
                
                <button 
                    type="button" 
                    className="btn btn-primary w-100"
                    onClick={() => login()}
                >
                    Entrar
                </button>
            </form>
        </div>
    </div>
</>
    );
};