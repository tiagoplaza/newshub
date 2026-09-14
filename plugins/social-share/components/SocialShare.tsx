"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiCopy } from "react-icons/fi";
import type { SocialNetworkConfig, SocialShareIcon } from "../index";

export interface SocialShareProps {
  title?: string;
  url?: string;
  className?: string;
  networks?: SocialNetworkConfig[];
}

const BUILD_IN_NETWORKS: SocialNetworkConfig[] = [
  { id: "facebook", name: "Facebook", icon: "facebook", active: true },
  { id: "x", name: "X", icon: "x", active: true },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin", active: true },
  { id: "whatsapp", name: "WhatsApp", icon: "whatsapp", active: true },
  { id: "telegram", name: "Telegram", icon: "telegram", active: true },
  { id: "mail", name: "E-mail", icon: "mail", active: true },
];

const ICONS: Record<SocialShareIcon, React.ComponentType<{ className?: string }>> = {
  facebook: FaFacebookF,
  x: FaXTwitter,
  linkedin: FaLinkedinIn,
  whatsapp: FaWhatsapp,
  telegram: FaTelegramPlane,
  mail: FaEnvelope,
  copy: FiCopy,
};

function buildShareUrl(network: SocialNetworkConfig, url: string, title: string): string {
  const safeUrl = encodeURIComponent(url);
  const safeTitle = encodeURIComponent(title);

  switch (network.icon) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${safeUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${safeTitle}&url=${safeUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${safeUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${safeUrl}&text=${safeTitle}`;
    case "mail":
      return `mailto:?subject=${safeTitle}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;
    case "copy":
      return "#copy";
    default:
      return `https://www.linkedin.com/sharing/share-offsite/?url=${safeUrl}`;
  }
}

export default function SocialShare({ title, url, className, networks }: SocialShareProps) {
  const [loadedNetworks, setLoadedNetworks] = useState<SocialNetworkConfig[]>(BUILD_IN_NETWORKS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (networks && networks.length > 0) {
      setLoadedNetworks(networks.filter((network) => network.active));
      return;
    }

    let active = false;
    fetch("/api/plugins/social-share")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.networks) && data.networks.length > 0) {
          active = true;
          setLoadedNetworks(data.networks.filter((network: SocialNetworkConfig) => network.active));
        }
      })
      .catch(() => {
        // ignora falha na busca e mantém os valores padrão
      })
      .finally(() => {
        if (!active) setLoadedNetworks(BUILD_IN_NETWORKS.filter((network) => network.active));
      });
  }, [networks]);

  const resolvedTitle = useMemo(() => {
    return title || (typeof document !== "undefined" ? document.title : "Confira esta página");
  }, [title]);

  const resolvedUrl = useMemo(() => {
    if (url) return url;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [url]);

  if (!resolvedUrl || !loadedNetworks.length) return null;

  const handleAction = async (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, network: SocialNetworkConfig) => {
    const shareUrl = buildShareUrl(network, resolvedUrl, resolvedTitle);

    if (network.icon === "copy") {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(resolvedUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        window.prompt("Copie o link da página:", resolvedUrl);
      }
      return;
    }

    if (typeof window !== "undefined") {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {loadedNetworks.map((network) => {
        const Icon = ICONS[network.icon];
        if (!Icon) { return null; }

        return (
          <button
            key={network.id}
            type="button"
            onClick={(event) => handleAction(event, network)}
            title={`Compartilhar no ${network.name}`}
            aria-label={`Compartilhar no ${network.name}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-red-500 hover:text-red-600"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      {copied && (
        <span className="text-xs font-medium text-emerald-600">Link copiado!</span>
      )}
    </div>
  );
}
