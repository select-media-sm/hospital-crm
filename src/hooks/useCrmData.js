import { useState, useEffect } from "react";
import { seedData } from "../data.js";

const STORAGE_KEY = "crm-state-v3";

export function useCrmData() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const seeded = seedData();
        setData(seeded);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch (e) {
      setData(seedData());
    }
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (status !== "ready" || !data) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }, 300);
    return () => clearTimeout(t);
  }, [data, status]);

  return [data, setData, status];
}
