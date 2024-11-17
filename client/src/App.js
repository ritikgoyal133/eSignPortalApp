import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DocumentUpload from "./pages/Document/Upload";
import DocumentESigning from "./pages/Document/ESign";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <Header />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/esign/:docId" element={<DocumentESigning />} />
        </Routes>
      </div>
      <ToastContainer />
    </Router>
  );
}

export default App;
