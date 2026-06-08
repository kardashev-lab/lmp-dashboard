"use client";
import { useState, useEffect } from "react";

export default function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "UTC", hour12: false,
      });
    setTime(fmt());
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return <>As of {time} UTC</>;
}
