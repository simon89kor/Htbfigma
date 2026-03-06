
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Dark-first: always apply dark class to html element
  document.documentElement.classList.add("dark");

  const root = document.getElementById("root")!;
  createRoot(root).render(<App />);
  // Reveal after CSS is applied (next frame)
  requestAnimationFrame(() => root.classList.add("ready"));
  