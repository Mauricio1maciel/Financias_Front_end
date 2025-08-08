import { useNavigate } from "react-router-dom";
import cookie from "js-cookie";
import { useEffect, useState } from 'react';

export default function PaginaSegura({ children }) {
    const navegacao = useNavigate();
    const [autenticado, setAutenticado] = useState(null); // null = em verificação

    useEffect(() => {
        const token = cookie.get('token');
        if (!token) {
            navegacao('/login');
        } else {
            setAutenticado(true);
        }
    }, [navegacao]);

    if (autenticado === null) {
        return <div className="container vh-100 d-flex justify-content-center align-items-center"> 
        <p>Verificando autenticação...</p> 
        </div>; // ou um spinner
    }

    return children;
}
