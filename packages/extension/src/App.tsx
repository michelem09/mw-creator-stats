import { useEffect, useState } from "react";
import { Dashboard } from "@mw/ui/Dashboard";
import { ModelDetail } from "@mw/ui/ModelDetail";
import { ExtProviders } from "./providers";

function useHashPath(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#/, "") || "/";
}

export function App() {
  const path = useHashPath();
  const m = /^\/models\/(\d+)/.exec(path);
  return (
    <ExtProviders>
      {m ? <ModelDetail id={Number(m[1])} /> : <Dashboard sessionAuth />}
    </ExtProviders>
  );
}
