"use client";

import { useEffect } from "react";
import { initReveal } from "@/lib/ui/reveal";

/** Mounts the scroll-reveal controller once for the whole app. Renders nothing. */
export default function Motion() {
  useEffect(() => initReveal(), []);
  return null;
}
