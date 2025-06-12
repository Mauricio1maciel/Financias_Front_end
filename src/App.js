import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Menu from './componentes/Menu';
import Home from './paginas/Home';
import FormRecDes from './paginas/Form_Rec_Des';
import Receitas from './paginas/Receita';
import RelatoriosPage from './paginas/RelatoriosPage';

function App() {
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
                <Route path='/' element={<Home />} />

                <Route path="/receitas" element={<Receitas />} />

                <Route path="/relatoriospage" element={<RelatoriosPage />} />
                

                <Route path='/Form_Rec_Des' element={<FormRecDes />} />
                <Route path='/Form_Rec_Des/:id' element={<FormRecDes />} />
                <Route path='*' element={<Home />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
