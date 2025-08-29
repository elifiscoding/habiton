import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-title">Habiton</div>

      <NavLink
        to="/habits"
        className={({ isActive }) =>
          isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
        }
      >
        Habits
      </NavLink>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
        }
      >
        Analytics
      </NavLink>
    </div>
  );
}
