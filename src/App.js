import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Menu from "./componentes/Menu";
import Home from "./paginas/Home";
import FormRecDes from "./paginas/Form_Rec_Des";
import Receitas from "./paginas/Receita";
import RelatoriosPage from "./paginas/RelatoriosPage";
import FormLogin from "./paginas/FormLogin";
import PaginaSegura from "./componentes/PaginaSegura";
import Api from "./servico/Api";
import Configuracoes from "./paginas/Configuracoes";
import FormTrocarSenha from "./paginas/FormTrocarSenha";
import FormNovoUsuario from "./paginas/FormNovoUsuario";
import Chat from "./paginas/Chat";
import RelatorioPeriodo from "./paginas/RelatorioPorPeriodo";

function AppContent() {
  const location = useLocation();
  const esconderMenu = location.pathname === "/login";

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  // ✅ Tema
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // ✅ Lembrar tema ao recarregar
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  // ✅ Toda vez que mudar o tema → aplica no HTML e salva
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    Api.setTokenAxios();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Menu */}
      {!esconderMenu && (
        <Menu isExpanded={isExpanded} toggleMenu={toggleMenu} />
      )}

      {/* Conteúdo principal */}
      <main
        className="bg-body text-body"
        style={{
          marginLeft: esconderMenu ? "0px" : isExpanded ? "250px" : "60px",
          flexGrow: 1,
          padding: "2rem",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        {/* ✅ Botão para trocar tema */}
        {!esconderMenu && (
          <div className="text-end mb-3">
            <button className="btn btn-secondary" onClick={toggleTheme}>
              {theme === "light" ? "Modo Escuro 🌙" : "Modo Claro ☀️"}
            </button>
          </div>
        )}

        <Routes>
          <Route path="/" element={<PaginaSegura><Home /></PaginaSegura>} />
          <Route path="/configuracoes" element={<PaginaSegura><Configuracoes /></PaginaSegura>} />
          <Route path="/novousuario" element={<PaginaSegura><FormNovoUsuario /></PaginaSegura>} />
          <Route path="/trocarsenha" element={<PaginaSegura><FormTrocarSenha /></PaginaSegura>} />
          <Route path="/receitas" element={<PaginaSegura><Receitas /></PaginaSegura>} />
          <Route path="/relatoriospage" element={<PaginaSegura><RelatoriosPage /></PaginaSegura>} />
          <Route path="/relatorioperiodo" element={<PaginaSegura><RelatorioPeriodo /></PaginaSegura>} />
          <Route path="/Form_Rec_Des" element={<PaginaSegura><FormRecDes /></PaginaSegura>} />
          <Route path="/Form_Rec_Des/:id" element={<PaginaSegura><FormRecDes /></PaginaSegura>} />
          <Route path="/chat" element={<PaginaSegura><Chat /></PaginaSegura>} />
          <Route path="/login" element={<FormLogin />} />
          <Route path="*" element={<PaginaSegura><Home /></PaginaSegura>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

