import { useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { routes } from "./router/routes";
import { useDataStore } from "./stores/DataStore";
import { LearnPage } from "./pages/LearnPage";
import { PracticePage } from "./pages/PracticePage";
import { MistakesPage } from "./pages/MistakesPage";
import { ProgressPage } from "./pages/ProgressPage";
import "./styles.css";

const PAGE_VIEWS: Record<string, ComponentType> = {
  "/learn": LearnPage,
  "/practice": PracticePage,
  "/mistakes": MistakesPage,
  "/progress": ProgressPage
};

function currentRoute(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return routes.some((route) => route.route === hash) ? hash : routes[0].route;
}

function App() {
  const bootstrap = useDataStore((state) => state.bootstrap);
  const bootstrapped = useDataStore((state) => state.bootstrapped);
  const loading = useDataStore((state) => state.loading);
  const bootError = useDataStore((state) => state.bootError);
  const [route, setRoute] = useState<string>(currentRoute());

  useEffect(() => {
    void bootstrap();
    const onHashChange = () => setRoute(currentRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [bootstrap]);

  const navigate = (next: string) => {
    window.location.hash = next;
    setRoute(next);
  };

  const View = PAGE_VIEWS[route] ?? LearnPage;

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          盲文点字
          <small>学习训练器 · 卡片版本化</small>
        </div>
        <nav>
          {routes.map((item) => (
            <button
              key={item.route}
              className={route === item.route ? "active" : ""}
              onClick={() => navigate(item.route)}
            >
              {item.name}
            </button>
          ))}
        </nav>
        <p className="shell-foot">数据保存在浏览器 IndexedDB</p>
      </aside>
      {loading && !bootstrapped ? (
        <main className="page">
          <div className="boot-loading">正在装载本地数据并兼容回填旧版本记录…</div>
        </main>
      ) : (
        <div className="page-wrapper">
          {bootError && (
            <div className="notice danger boot-error">
              <span>{bootError}</span>
              <button className="link" onClick={() => window.location.reload()}>
                重新加载
              </button>
            </div>
          )}
          <View />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
