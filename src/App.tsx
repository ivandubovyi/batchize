import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footerdemo } from "@/components/ui/footer-section";
import { Landing } from "@/pages/Landing";
import { Review } from "@/pages/Review";
import { AppShell } from "@/pages/app/Shell";
import { Dashboard } from "@/pages/app/Dashboard";
import { QuickScore } from "@/pages/app/QuickScore";
import { Application } from "@/pages/app/Application";
import { AppReview } from "@/pages/app/AppReview";
import { Interview } from "@/pages/app/Interview";
import { Chancing } from "@/pages/app/Chancing";
import { Tools } from "@/pages/app/Tools";

function parseHash(hash: string): { route: string; query: URLSearchParams } {
  const [path, qs] = hash.split("?");
  return { route: path || "#/", query: new URLSearchParams(qs ?? "") };
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("batchize-theme") === "dark"
  );

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);
      if (window.location.hash.startsWith("#/")) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("batchize-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const { route, query } = parseHash(hash);

  let page: React.ReactNode;
  if (route.startsWith("#/app")) {
    const sub =
      route === "#/app" ? (
        <Dashboard />
      ) : route === "#/app/quick" ? (
        <QuickScore />
      ) : route === "#/app/application" ? (
        <Application query={query} />
      ) : route === "#/app/review" ? (
        <AppReview />
      ) : route === "#/app/interview" ? (
        <Interview />
      ) : route === "#/app/chancing" ? (
        <Chancing />
      ) : route === "#/app/tools" ? (
        <Tools />
      ) : (
        <Dashboard />
      );
    page = <AppShell route={route}>{sub}</AppShell>;
  } else if (route === "#/review") {
    page = <Review />;
  } else {
    page = <Landing />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      {page}
      <Footerdemo isDarkMode={isDarkMode} onToggleDarkMode={setIsDarkMode} />
    </div>
  );
}
