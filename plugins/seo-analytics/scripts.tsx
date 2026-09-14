import Script from "next/script";
import { getSeoAnalyticsSettings } from "./index";

/** Renderiza GTM, GA e AdSense no <head>. Deve ficar dentro de <head> no layout raiz. */
export async function AnalyticsHeadScripts() {
  const { active, settings } = await getSeoAnalyticsSettings();
  if (!active) return null;

  return (
    <>
      {settings.gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmId}');`}
        </Script>
      )}
      {settings.gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.gaId}');`}
          </Script>
        </>
      )}
      {settings.adsenseClientId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}

/** <noscript> do GTM. Deve ficar logo após a abertura de <body>. */
export async function AnalyticsBodyNoScript() {
  const { active, settings } = await getSeoAnalyticsSettings();
  if (!active || !settings.gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${settings.gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}