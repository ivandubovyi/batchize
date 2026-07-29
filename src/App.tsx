import { Suspense, lazy, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footerdemo } from "@/components/ui/footer-section";
import { Landing } from "@/pages/Landing";

// The landing page is the only thing most visitors ever see, and it is what
// search results point at. Everything behind it loads on demand so the first
// paint does not carry the whole workspace.
const Review = lazy(() => import("@/pages/Review").then((m) => ({ default: m.Review })));
const AppShell = lazy(() => import("@/pages/app/Shell").then((m) => ({ default: m.AppShell })));
const Dashboard = lazy(() => import("@/pages/app/Dashboard").then((m) => ({ default: m.Dashboard })));
const QuickScore = lazy(() => import("@/pages/app/QuickScore").then((m) => ({ default: m.QuickScore })));
const Application = lazy(() => import("@/pages/app/Application").then((m) => ({ default: m.Application })));
const AppReview = lazy(() => import("@/pages/app/AppReview").then((m) => ({ default: m.AppReview })));
const Interview = lazy(() => import("@/pages/app/Interview").then((m) => ({ default: m.Interview })));
const Chancing = lazy(() => import("@/pages/app/Chancing").then((m) => ({ default: m.Chancing })));
const Tools = lazy(() => import("@/pages/app/Tools").then((m) => ({ default: m.Tools })));
const Partner = lazy(() => import("@/pages/app/Partner").then((m) => ({ default: m.Partner })));
const Drafts = lazy(() => import("@/pages/app/Drafts").then((m) => ({ default: m.Drafts })));
const Submit = lazy(() => import("@/pages/app/Submit").then((m) => ({ default: m.Submit })));
const Grill = lazy(() => import("@/pages/app/Grill").then((m) => ({ default: m.Grill })));
const Account = lazy(() => import("@/pages/app/Account").then((m) => ({ default: m.Account })));
const Pricing = lazy(() => import("@/pages/Pricing").then((m) => ({ default: m.Pricing })));

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
      ) : route === "#/app/partner" ? (
        <Partner />
      ) : route === "#/app/drafts" ? (
        <Drafts />
      ) : route === "#/app/submit" ? (
        <Submit />
      ) : route === "#/app/grill" ? (
        <Grill />
      ) : route === "#/app/account" ? (
        <Account />
      ) : (
        <Dashboard />
      );
    page = <AppShell route={route}>{sub}</AppShell>;
  } else if (route === "#/pricing") {
    page = <Pricing />;
  } else if (route === "#/review") {
    page = <Review />;
  } else {
    page = <Landing />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        {page}
      </Suspense>
      <Footerdemo isDarkMode={isDarkMode} onToggleDarkMode={setIsDarkMode} />
    </div>
  );
}
