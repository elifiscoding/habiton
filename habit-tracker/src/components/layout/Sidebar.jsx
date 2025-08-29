import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass =
    "block px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition";
  const active = "bg-gray-200 text-gray-900";

  return (
    <div className="w-48 border-r bg-white flex flex-col p-4 space-y-2">
      <div className="text-lg font-semibold mb-4">Habiton</div>

      <NavLink
        to="/habits"
        className={({ isActive }) =>
          `${linkClass} ${isActive ? active : "text-gray-600"}`
        }
      >
        Habits
      </NavLink>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `${linkClass} ${isActive ? active : "text-gray-600"}`
        }
      >
        Analytics
      </NavLink>
    </div>
  );
}
