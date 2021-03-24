import React from "react";
import { PageHeader } from "antd";

export default function Header() {
  return (
    <a href="/" /*target="_blank" rel="noopener noreferrer"*/>
      <PageHeader title="🏗 scaffold-eth" subTitle="erc20 vendor token. have fun!!! " style={{ cursor: "pointer" }} />
    </a>
  );
}
