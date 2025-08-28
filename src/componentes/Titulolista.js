// src/componentes/Titulolista.js
import { Link } from "react-router-dom";

export default function Titulolista({ titulo, descricao, rota }) {
  return (
    <div className="d-flex justify-content-between align-items-center bg-primary text-white p-3 rounded mb-4 shadow">
      <div>
        <h5 className="mb-1">{titulo}</h5>
        <small>{descricao}</small>
      </div>
      <Link to={rota} className="btn btn-light">
        <i className="bi bi-plus-lg me-1"></i> Novo
      </Link>
    </div>
  );
}
