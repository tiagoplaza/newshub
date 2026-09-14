"use client";

import { useEffect, useState } from "react";

const ICON_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "mail", label: "E-mail" },
  { value: "copy", label: "Copiar link" },
] as const;

type IconValue = (typeof ICON_OPTIONS)[number]["value"];

type Network = {
  id: string;
  name: string;
  icon: IconValue;
  active: boolean;
};

interface Settings {
  active: boolean;
  networks: Network[];
}

function createNetwork(partial: Partial<Network> = {}): Network {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name ?? "Nova rede",
    icon: partial.icon ?? "facebook",
    active: partial.active ?? true,
  };
}

function getIconLabel(icon: IconValue) {
  return (
    ICON_OPTIONS.find((option) => option.value === icon)?.label ??
    icon
  );
}

export default function SocialSharePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/plugins/social-share");

      const data = await res.json();

      if (!res.ok) {
        setNotice(
          data.error ??
            "Não foi possível carregar as redes sociais."
        );
        return;
      }

      setSettings({
        active: data.active ?? false,
        networks:
          Array.isArray(data.networks) &&
          data.networks.length > 0
            ? data.networks
            : [
                createNetwork({
                  name: "Facebook",
                  icon: "facebook",
                }),
                createNetwork({
                  name: "X",
                  icon: "x",
                }),
                createNetwork({
                  name: "LinkedIn",
                  icon: "linkedin",
                }),
              ],
      });
    } catch {
      setNotice(
        "Não foi possível conectar ao servidor."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!settings) return;

    setBusy(true);
    setNotice(null);

    try {
      const payload = {
        networks: settings.networks
          .filter(
            (network) =>
              network.name.trim().length > 0
          )
          .map((network) => ({
            id: network.id,
            name: network.name.trim(),
            icon: network.icon,
            active: network.active,
          })),
      };

      const res = await fetch(
        "/api/plugins/social-share",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setNotice(
          data.error ??
            "Não foi possível salvar."
        );
        return;
      }

      setNotice("Redes sociais salvas.");
      await load();
    } catch {
      setNotice(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setBusy(false);
    }
  }

  function updateNetwork(
    index: number,
    patch: Partial<Network>
  ) {
    if (!settings) return;

    const next = [...settings.networks];

    next[index] = {
      ...next[index],
      ...patch,
    };

    setSettings({
      ...settings,
      networks: next,
    });
  }

  function addNetwork() {
    if (!settings) return;

    setSettings({
      ...settings,
      networks: [
        ...settings.networks,
        createNetwork({
          name: "Nova rede",
          icon: "facebook",
        }),
      ],
    });
  }

  function removeNetwork(index: number) {
    if (!settings) return;

    setSettings({
      ...settings,
      networks: settings.networks.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    });
  }

  if (!settings) {
    return (
      <div className="empty-state">
        Carregando…
      </div>
    );
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">
            Social Share
          </h1>

          <p className="admin-subtitle">
            Cadastre as redes sociais e defina
            quais aparecem no compartilhamento
            das notícias.
          </p>
        </div>
      </header>

      {notice && (
        <div
          className="error-banner"
          style={{
            background: "var(--blue-100)",
            color: "var(--blue-600)",
            borderColor: "#c4d2e6",
          }}
        >
          {notice}
        </div>
      )}

      {!settings.active && (
        <div className="error-banner">
          Ative o plugin na listagem para que os
          botões apareçam no tema.
        </div>
      )}

      <section
        className="card card-pad"
        style={{
          maxWidth: 820,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>
            Redes configuradas
          </strong>

          <button
            className="btn btn-primary"
            type="button"
            onClick={addNetwork}
          >
            + Adicionar rede
          </button>
        </div>

        {settings.networks.length === 0 && (
          <div className="empty-state">
            Nenhuma rede cadastrada ainda.
          </div>
        )}

        {settings.networks.map(
          (network, index) => (
            <div
              key={network.id}
              className="card card-pad"
              style={{
                display: "grid",
                gap: 12,
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.4fr 1fr auto",
                  gap: 12,
                }}
              >
                <div>
                  <label className="form-label">
                    Nome da rede
                  </label>

                  <input
                    className="form-input"
                    value={network.name}
                    onChange={(event) =>
                      updateNetwork(index, {
                        name: event.target.value,
                      })
                    }
                    placeholder="Ex.: Facebook"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Ícone
                  </label>

                  <select
                    className="form-input"
                    value={network.icon}
                    onChange={(event) =>
                      updateNetwork(index, {
                        icon:
                          event.target
                            .value as IconValue,
                      })
                    }
                  >
                    {ICON_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={network.active}
                      onChange={(event) =>
                        updateNetwork(index, {
                          active:
                            event.target
                              .checked,
                        })
                      }
                    />

                    Ativa
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  Ícone selecionado:{" "}
                  <strong>
                    {getIconLabel(
                      network.icon
                    )}
                  </strong>
                </span>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() =>
                    removeNetwork(index)
                  }
                >
                  Remover
                </button>
              </div>
            </div>
          )
        )}

        <div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={save}
            disabled={busy}
          >
            {busy
              ? "Salvando…"
              : "Salvar redes sociais"}
          </button>
        </div>
      </section>
    </>
  );
}
