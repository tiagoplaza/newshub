import Script from "next/script";
import { getAdCashSettings } from "./index";

export async function AdCashHeadScripts() {
  const { active, settings } = await getAdCashSettings();

  if (!active) return null;

  const hasAutoTag = settings.enableAutoTag && !!settings.autoTagZoneId; 
  const hasActiveBanner = settings.banners?.some( (banner) => banner.enabled && !!banner.zoneId && !!banner.renderIn, ) ?? false;

  if (!hasAutoTag && !hasActiveBanner) return null;

  return (
    <>
      <Script
        id="adcash-library"
        src="https://acscdn.com/script/aclib.js"
        strategy="beforeInteractive"
      />
      {settings.enableAutoTag && settings.autoTagZoneId && (
        <Script id="adcash-autotag" strategy="beforeInteractive">
          {`aclib.runAutoTag({zoneId: ${JSON.stringify(settings.autoTagZoneId)}});`}
        </Script>
      )}
    </>
  );
}