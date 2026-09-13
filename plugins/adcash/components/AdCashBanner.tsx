"use client";

import { useEffect } from "react";
import type { AdCashBanner as AdCashBannerConfig } from "../index";

declare global {
  interface Window {
    aclib?: {
      runBanner: (config: {
        zoneId: string;
        renderIn: string;
      }) => void;
    };
  }
}
interface AdCashBannerProps { banner: AdCashBannerConfig; }
const renderedTargets = new WeakSet<Element>();

export function AdCashBanner({ banner, }: AdCashBannerProps) {
  useEffect(() => {
    if (!banner.enabled || !banner.zoneId || !banner.renderIn) return;

    const renderIn = banner.renderIn.startsWith("#")
      ? banner.renderIn
      : `#${banner.renderIn}`;

    const runBanner = () => {
      if (!window.aclib) return false;
      const target = document.querySelector(renderIn);
      if (!target) return false;
      if (renderedTargets.has(target)) return true;

      window.aclib.runBanner({
        zoneId: banner.zoneId,
        renderIn,
      });

      renderedTargets.add(target);
      return true;
    }

    if (runBanner()) return;

    const interval = window.setInterval(() => {
      if (runBanner()) window.clearInterval(interval);
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  },[ banner.id, banner.enabled, banner.zoneId, banner.renderIn ])
  if (!banner.enabled || !banner.zoneId || !banner.renderIn) return null;

  const targetId = banner.renderIn.startsWith("#")
    ? banner.renderIn.substring(1)
    : banner.renderIn;

  return (<div id={targetId} />);
}