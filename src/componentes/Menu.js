import { NavLink } from "react-router-dom";
import { FaChartLine, FaMoneyBillWave, FaFileInvoiceDollar, FaCogs } from "react-icons/fa";

export default function Menu() {
  return (
    <div
      className="bg-dark min-vh-100 position-fixed top-0 start-0 d-flex flex-column align-items-center pt-3"
      style={{ width: "60px", backgroundColor: "#1a1a1a", zIndex: 1030 }}
    >
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link d-flex justify-content-center p-2 rounded ${isActive ? "bg-secondary text-dark" : "text-white"}`
            }
          >
            <FaChartLine size={20} />
          </NavLink>
        </li>
         <li className="nav-item mb-3">
          <NavLink
            to="/receitas"
            className={({ isActive }) =>
              `nav-link d-flex justify-content-center p-2 rounded ${isActive ? "bg-secondary text-dark" : "text-white"}`
            }
          >
            <FaChartLine size={20} />
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/Form_Rec_Des"
            className={({ isActive }) =>
              `nav-link d-flex justify-content-center p-2 rounded ${isActive ? "bg-secondary text-dark" : "text-white"}`
            }
          >
            <FaMoneyBillWave size={20} />
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/relatoriospage"
            className={({ isActive }) =>
              `nav-link d-flex justify-content-center p-2 rounded ${isActive ? "bg-secondary text-dark" : "text-white"}`
            }
          >
            <FaFileInvoiceDollar size={20} />
          </NavLink>
        </li>
        <li className="nav-item mb-3">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `nav-link d-flex justify-content-center p-2 rounded ${isActive ? "bg-secondary text-dark" : "text-white"}`
            }
          >
            <FaCogs size={20} />
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
