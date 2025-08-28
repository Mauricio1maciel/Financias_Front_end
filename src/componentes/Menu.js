import { NavLink } from "react-router-dom";
import { 
  FaBars,
  FaChartLine, 
  FaCogs, 
  FaMoneyBillWave, 
  FaPiggyBank, 
  FaCommentDots, 
  FaPlus 
} from "react-icons/fa";


export default function Menu({ isExpanded, toggleMenu }) {


  return (
    <div
      className="bg-body-tertiary d-flex flex-column pt-3 min-vh-100 position-fixed top-0 start-0"
      style={{ 
        width: isExpanded ? "250px" : "60px", 
        zIndex: 1030,
        transition: "width 0.3s ease-in-out"
      }}
    >
      <button 
        onClick={toggleMenu} 
        className="btn btn-light d-flex align-items-center justify-content-center mb-3 ms-2 border"
        style={{ width: '40px', height: '40px' }}
      >
        <FaBars size={20} color="black" />
      </button>

      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-3">
          <NavLink
            to="/despesas"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaMoneyBillWave size={20} />
            {isExpanded && <span className="ms-3">Despesas</span>}
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/receitas"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaPiggyBank size={20} />
            {isExpanded && <span className="ms-3">Receitas</span>}
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/Form_Rec_Des"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaPlus size={20} />
            {isExpanded && <span className="ms-3">Adicionar</span>}
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/relatoriospage"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaChartLine size={20} />
            {isExpanded && <span className="ms-3">Relatórios</span>}
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaCommentDots size={20} />
            {isExpanded && <span className="ms-3">Chat</span>}
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center p-2 rounded ${!isExpanded && 'justify-content-center'} ${
                isActive ? "bg-primary text-white" : "text-dark"
              }`
            }
          >
            <FaCogs size={20} />
            {isExpanded && <span className="ms-3">Configurações</span>}
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
