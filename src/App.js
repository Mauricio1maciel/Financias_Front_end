import { useState, useEffect } from 'react'; // 1. Importar useState
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Menu from './componentes/Menu';
import Home from './paginas/Home';
import FormRecDes from './paginas/Form_Rec_Des';
import Receitas from './paginas/Receita';
import RelatoriosPage from './paginas/RelatoriosPage';
import FormLogin from './paginas/FormLogin';
import PaginaSegura from './componentes/PaginaSegura';
import Api from './servico/Api';
import Configuracoes from './paginas/Configuracoes';
import FormTrocarSenha from './paginas/FormTrocarSenha';
import FormNovoUsuario from './paginas/FormNovoUsuario';
import Chat from './paginas/Chat';

function AppContent() {
  const location = useLocation();
  const esconderMenu = location.pathname === '/login';

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    Api.setTokenAxios();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Menu */}
      {!esconderMenu && (
        <Menu isExpanded={isExpanded} toggleMenu={toggleMenu} />
      )}

      {/* Conteúdo principal */}
      <main style={{
        marginLeft: esconderMenu ? '0px' : (isExpanded ? '250px' : '60px'),
        flexGrow: 1,
        padding: '2rem',
        backgroundColor: "#f8f9fa",
        transition: 'margin-left 0.3s ease-in-out' 
      }}>
        <Routes>
          <Route path='/' element={<PaginaSegura><Home /></PaginaSegura>} />
          <Route path='/configuracoes' element={<PaginaSegura><Configuracoes /></PaginaSegura>} />
          <Route path='/novousuario' element={<PaginaSegura><FormNovoUsuario /></PaginaSegura>} />
          <Route path='/trocarsenha' element={<PaginaSegura><FormTrocarSenha /></PaginaSegura>} />
          <Route path="/receitas" element={<PaginaSegura><Receitas /></PaginaSegura>} />
          <Route path="/relatoriospage" element={<PaginaSegura><RelatoriosPage /></PaginaSegura>} />
          <Route path='/Form_Rec_Des' element={<PaginaSegura><FormRecDes /></PaginaSegura>} />
          <Route path='/Form_Rec_Des/:id' element={<PaginaSegura><FormRecDes /></PaginaSegura>} />
          <Route path='/chat' element={<PaginaSegura><Chat /></PaginaSegura>} />
          <Route path='/login' element={<FormLogin />} />
          <Route path='*' element={<PaginaSegura><Home /></PaginaSegura>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
