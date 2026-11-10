import { type DevicePresenceSignals, isKnownCountryCode } from '@suite-common/geolocation';

type SystemLocaleSignals = { regionCode: string | null; preferredLanguages: readonly string[] };

type NativeLocaleSignals = { regionCode: string | null };

type BuildWebDeviceSignalsParams = { timeZone: string | null; languages: readonly string[] };

type BuildDesktopDeviceSignalsParams = {
    timeZone: string | null;
    locale: SystemLocaleSignals;
};

type BuildNativeDeviceSignalsParams = {
    timeZone: string | null;
    locales: readonly NativeLocaleSignals[];
};

// Browsers ship with English by default almost everywhere, so a first language left on it says nothing about the region.
const DEFAULT_ENGLISH_TAGS = ['en', 'en-us'];

// Firefox resistFingerprinting (Tor Browser, Mullvad Browser, LibreWolf) reports this zone wherever the user is.
// Users really in Iceland lose the time zone signal on web, but their IP and language region still decide.
const SPOOFED_WEB_TIME_ZONE = 'Atlantic/Reykjavik';

const normalizeTimeZone = (timeZone: string | null) => timeZone || null;

const normalizeRegion = (region: string | null | undefined) => {
    const normalized = region?.toUpperCase();

    return normalized && isKnownCountryCode(normalized) ? normalized : null;
};

const getUniqueRegions = (regions: readonly (string | null | undefined)[]) => [
    ...new Set(regions.map(normalizeRegion).filter(region => region !== null)),
];

const buildSignals = (
    timeZone: string | null,
    primaryRegion: string | null | undefined,
    secondaryRegions: readonly (string | null | undefined)[],
): DevicePresenceSignals => {
    const primary = normalizeRegion(primaryRegion);

    return {
        timeZone: normalizeTimeZone(timeZone),
        primaryRegion: primary,
        secondaryRegions: primary === null ? getUniqueRegions(secondaryRegions) : [],
    };
};

const isDefaultEnglish = (tag: string | undefined) =>
    tag !== undefined && DEFAULT_ENGLISH_TAGS.includes(tag.toLowerCase());

const toLanguageTag = (tag: string) => tag.split(/[.@]/)[0]?.replaceAll('_', '-') ?? tag;

export const getLanguageRegion = (tag: string): string | null => {
    try {
        return new Intl.Locale(toLanguageTag(tag)).region ?? null;
    } catch {
        return null;
    }
};

export const buildWebDeviceSignals = ({
    timeZone,
    languages,
}: BuildWebDeviceSignalsParams): DevicePresenceSignals => {
    const [firstLanguage, ...otherLanguages] = languages;
    const primaryLanguage = isDefaultEnglish(firstLanguage) ? undefined : firstLanguage;

    return buildSignals(
        timeZone === SPOOFED_WEB_TIME_ZONE ? null : timeZone,
        primaryLanguage && getLanguageRegion(primaryLanguage),
        otherLanguages.map(getLanguageRegion),
    );
};

export const buildDesktopDeviceSignals = ({
    timeZone,
    locale,
}: BuildDesktopDeviceSignalsParams): DevicePresenceSignals =>
    buildSignals(timeZone, locale.regionCode, locale.preferredLanguages.map(getLanguageRegion));

export const buildNativeDeviceSignals = ({
    timeZone,
    locales,
}: BuildNativeDeviceSignalsParams): DevicePresenceSignals => {
    const [firstLocale, ...otherLocales] = locales;

    return buildSignals(
        timeZone,
        firstLocale?.regionCode,
        otherLocales.map(({ regionCode }) => regionCode),
    );
};
