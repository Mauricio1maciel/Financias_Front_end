import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Menu from './componentes/Menu';
import Home from './paginas/Home';
import FormRecDes from './paginas/Form_Rec_Des';
import Receitas from './paginas/Receita';
import RelatoriosPage from './paginas/RelatoriosPage';
import FormLogin from './paginas/FormLogin';
import PaginaSegura from './componentes/PaginaSegura';
import Api from './servico/Api'
import { useEffect } from 'react';
import Configuracoes from './paginas/Configuracoes';
import FormTrocarSenha from './paginas/FormTrocarSenha';
import FormNovoUsuario from './paginas/FormNovoUsuario';

function App() {

  useEffect(()=>{
  Api.setTokenAxios();
}, [])

  return (
    <BrowserRouter>
      <div className="container-fluid">
        <div className="row min-vh-100">
          {/* Sidebar */}
          <div className="col-auto px-0">
            <Menu />
          </div>

          {/* Conteúdo principal */}
          <div className="col ps-0" style={{ backgroundColor: "#f8f9fa" }}>
            <div className="p-4">
              <Routes>
                <Route path='/' element={<PaginaSegura> <Home /> </PaginaSegura>} />

                <Route path='/configuracoes' element={<PaginaSegura> <Configuracoes /></PaginaSegura>}/>
                <Route path='/novousuario' element={<PaginaSegura><FormNovoUsuario/></PaginaSegura>} />
                <Route path='/trocarsenha' element={<PaginaSegura> <FormTrocarSenha /></PaginaSegura>}/>

                <Route path="/receitas" element={<PaginaSegura> <Receitas /> </PaginaSegura>} />

                <Route path="/relatoriospage" element={<PaginaSegura><RelatoriosPage /> </PaginaSegura>} />
                

                <Route path='/Form_Rec_Des' element={<PaginaSegura> <FormRecDes /> </PaginaSegura>} />
                <Route path='/Form_Rec_Des/:id' element={<PaginaSegura> <FormRecDes /> </PaginaSegura>} />
                <Route path='*' element={<PaginaSegura> <Home /> </PaginaSegura>} />

                <Route path='/login' element={<FormLogin />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
