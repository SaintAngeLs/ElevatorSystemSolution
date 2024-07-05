"use client";

import React from "react";
import { useRouter } from "next/navigation";

const Sidebar = () => {
  const router = useRouter();

  const tabs = [
    { name: "Home", route: "/" },
    { name: "Management", route: "/management" },
    { name: "Live Updates", route: "/live-updates" },
  ];

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <h1 className="text-3xl font-bold p-4">Elevator Dashboard</h1>
      <nav className="flex flex-col p-4">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => router.push(tab.route)}
            className="py-2 px-4 mb-2 text-left hover:bg-gray-700 rounded transition duration-200"
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
