import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/pages/Dashboard";
import Categories from "./components/pages/Categories";
import Analytics from "./components/pages/Analytics";
import Sidebar from "./components/layout/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex app-bg">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/habits" replace />} />
            <Route path="/habits" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
