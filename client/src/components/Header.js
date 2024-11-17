import React from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Header = () => {
  return (
    <header className="bg-light p-3 shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            eSign
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `nav-link btn mx-2 ${
                      isActive ? "btn-primary" : "btn-outline-primary"
                    }`
                  }
                  aria-label="Go to Dashboard"
                  aria-current={({ isActive }) =>
                    isActive ? "page" : undefined
                  }
                >
                  Dashboard
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `nav-link btn mx-2 ${
                      isActive ? "btn-primary" : "btn-outline-primary"
                    }`
                  }
                  aria-label="Upload Document"
                  aria-current={({ isActive }) =>
                    isActive ? "page" : undefined
                  }
                >
                  Upload Document
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
