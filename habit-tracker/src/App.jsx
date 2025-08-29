import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/analytics/Analytics";
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
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
