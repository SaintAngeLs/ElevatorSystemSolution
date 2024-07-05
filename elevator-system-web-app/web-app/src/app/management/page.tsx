import React from "react";
import dynamic from "next/dynamic";

const Management = dynamic(() => import("../../components/Management"), { ssr: false });

const Home = () => {
  return (
    <div>
      <Management />
    </div>
  );
};

export default Home;
