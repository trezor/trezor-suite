/**
 * DO NOT MODIFY BY HAND! This file was automatically generated.
 * Instead, modify the original JSONSchema file in /message-system/schema, and run yarn build:libs.
 */

/**
 * ISO 8601 date-time format.
 *
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "date-time".
 */
export type DateTime = string;
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "version".
 */
export type Version = string | string[];
export type Model = '1' | 'T' | 'T1B1' | 'T2T1' | 'T2B1' | 'Safe 3' | 'T3B1' | 'T3T1' | 'T3W1' | '';
export type FirmwareRevision = string;
export type FirmwareVariant = '*' | 'bitcoin-only' | 'universal';
/**
 * Eligible authorized vendors.
 */
export type Vendor = '*' | 'trezor.io';
/**
 * Supported THP pairing methods: 1=SkipPairing, 2=CodeEntry, 3=QrCode, 4=NFC.
 */
export type PairingMethod = 'SkipPairing' | 'CodeEntry' | 'QrCode' | 'NFC';
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "countryCodes".
 */
export type CountryCodes =
    | 'AD'
    | 'AE'
    | 'AF'
    | 'AG'
    | 'AI'
    | 'AL'
    | 'AM'
    | 'AO'
    | 'AQ'
    | 'AR'
    | 'AS'
    | 'AT'
    | 'AU'
    | 'AW'
    | 'AX'
    | 'AZ'
    | 'BA'
    | 'BB'
    | 'BD'
    | 'BE'
    | 'BF'
    | 'BG'
    | 'BH'
    | 'BI'
    | 'BJ'
    | 'BL'
    | 'BM'
    | 'BN'
    | 'BO'
    | 'BQ'
    | 'BR'
    | 'BS'
    | 'BT'
    | 'BV'
    | 'BW'
    | 'BY'
    | 'BZ'
    | 'CA'
    | 'CC'
    | 'CD'
    | 'CF'
    | 'CG'
    | 'CH'
    | 'CI'
    | 'CK'
    | 'CL'
    | 'CM'
    | 'CN'
    | 'CO'
    | 'CR'
    | 'CU'
    | 'CV'
    | 'CW'
    | 'CX'
    | 'CY'
    | 'CZ'
    | 'DE'
    | 'DJ'
    | 'DK'
    | 'DM'
    | 'DO'
    | 'DZ'
    | 'EC'
    | 'EE'
    | 'EG'
    | 'EH'
    | 'ER'
    | 'ES'
    | 'ET'
    | 'FI'
    | 'FJ'
    | 'FK'
    | 'FM'
    | 'FO'
    | 'FR'
    | 'GA'
    | 'GB'
    | 'GD'
    | 'GE'
    | 'GF'
    | 'GG'
    | 'GH'
    | 'GI'
    | 'GL'
    | 'GM'
    | 'GN'
    | 'GP'
    | 'GQ'
    | 'GR'
    | 'GS'
    | 'GT'
    | 'GU'
    | 'GW'
    | 'GY'
    | 'HK'
    | 'HM'
    | 'HN'
    | 'HR'
    | 'HT'
    | 'HU'
    | 'ID'
    | 'IE'
    | 'IL'
    | 'IM'
    | 'IN'
    | 'IO'
    | 'IQ'
    | 'IR'
    | 'IS'
    | 'IT'
    | 'JE'
    | 'JM'
    | 'JO'
    | 'JP'
    | 'KE'
    | 'KG'
    | 'KH'
    | 'KI'
    | 'KM'
    | 'KN'
    | 'KP'
    | 'KR'
    | 'KW'
    | 'KY'
    | 'KZ'
    | 'LA'
    | 'LB'
    | 'LC'
    | 'LI'
    | 'LK'
    | 'LR'
    | 'LS'
    | 'LT'
    | 'LU'
    | 'LV'
    | 'LY'
    | 'MA'
    | 'MC'
    | 'MD'
    | 'ME'
    | 'MF'
    | 'MG'
    | 'MH'
    | 'MK'
    | 'ML'
    | 'MM'
    | 'MN'
    | 'MO'
    | 'MP'
    | 'MQ'
    | 'MR'
    | 'MS'
    | 'MT'
    | 'MU'
    | 'MV'
    | 'MW'
    | 'MX'
    | 'MY'
    | 'MZ'
    | 'NA'
    | 'NC'
    | 'NE'
    | 'NF'
    | 'NG'
    | 'NI'
    | 'NL'
    | 'NO'
    | 'NP'
    | 'NR'
    | 'NU'
    | 'NZ'
    | 'OM'
    | 'PA'
    | 'PE'
    | 'PF'
    | 'PG'
    | 'PH'
    | 'PK'
    | 'PL'
    | 'PM'
    | 'PN'
    | 'PR'
    | 'PS'
    | 'PT'
    | 'PW'
    | 'PY'
    | 'QA'
    | 'RE'
    | 'RO'
    | 'RS'
    | 'RU'
    | 'RW'
    | 'SA'
    | 'SB'
    | 'SC'
    | 'SD'
    | 'SE'
    | 'SG'
    | 'SH'
    | 'SI'
    | 'SJ'
    | 'SK'
    | 'SL'
    | 'SM'
    | 'SN'
    | 'SO'
    | 'SR'
    | 'SS'
    | 'ST'
    | 'SV'
    | 'SX'
    | 'SY'
    | 'SZ'
    | 'TC'
    | 'TD'
    | 'TF'
    | 'TG'
    | 'TH'
    | 'TJ'
    | 'TK'
    | 'TL'
    | 'TM'
    | 'TN'
    | 'TO'
    | 'TR'
    | 'TT'
    | 'TV'
    | 'TW'
    | 'TZ'
    | 'UA'
    | 'UG'
    | 'UM'
    | 'US'
    | 'UY'
    | 'UZ'
    | 'VA'
    | 'VC'
    | 'VE'
    | 'VG'
    | 'VI'
    | 'VN'
    | 'VU'
    | 'WF'
    | 'WS'
    | 'YE'
    | 'YT'
    | 'ZA'
    | 'ZM'
    | 'ZW';
/**
 * Target users by country code (ISO 3166-1 alpha-2).
 *
 * @minItems 1
 */
export type CountryCode = CountryCodes[];
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "conditions".
 */
export type Conditions = Condition[];
export type Variant = 'info' | 'warning' | 'critical';
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "category".
 */
export type Category = 'banner' | 'context' | 'modal' | 'feature';
export type CTAAction = 'internal-link' | 'external-link';
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "tradingType".
 */
export type TradingType = 'buy' | 'sell' | 'exchange';
/**
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "yieldFlowType".
 */
export type YieldFlowType = 'deposit' | 'withdraw' | 'claim';

/**
 * JSON schema of the Trezor Suite messaging system.
 */
export interface MessageSystem {
    /**
     * A version of the messaging system. In case we would change the format of the config itself.
     */
    version: number;
    timestamp: DateTime;
    /**
     * An increasing counter. Trezor Suite must decline any sequence lower than the latest number. This is to protect against replay attacks, where an attacker could send an older version of the file, and Trezor Suite would accept it.
     */
    sequence: number;
    actions: Action[];
    experiments?: Experiments[];
}
export interface Action {
    conditions: Conditions;
    message: Message;
}
export interface Condition {
    duration?: Duration;
    os?: OperatingSystem;
    environment?: Environment;
    browser?: Browser;
    transport?: Transport;
    /**
     * @minItems 1
     */
    settings?: Settings[];
    devices?: Device[];
    countryCodes?: CountryCode;
}
export interface Duration {
    from: DateTime;
    to: DateTime;
}
export interface OperatingSystem {
    macos: Version;
    linux: Version;
    windows: Version;
    android: Version;
    ios: Version;
    chromeos: Version;
    [k: string]: Version;
}
export interface Environment {
    desktop: Version;
    mobile: Version;
    web: Version;
    revision?: string;
    [k: string]: unknown;
}
export interface Browser {
    firefox: Version;
    chrome: Version;
    chromium: Version;
    [k: string]: Version;
}
export interface Transport {
    bridge: Version;
    webusbplugin: Version;
    [k: string]: Version;
}
/**
 * If a setting is not specified, then it can be either true or false. Currently, 'tor' and coin symbols are supported.
 */
export interface Settings {
    tor?: boolean;
    [k: string]: unknown;
}
export interface Device {
    model: Model;
    firmwareRevision: FirmwareRevision;
    firmware: Version;
    bootloader: Version;
    variant: FirmwareVariant;
    vendor: Vendor;
    thpProperties?: TrezorHostProtocolTHPProperties;
}
export interface TrezorHostProtocolTHPProperties {
    internalModel?: string;
    modelVariant?: number;
    protocolVersionMajor?: number;
    protocolVersionMinor?: number;
    pairingMethods?: PairingMethod[];
}
export interface Message {
    id: string;
    priority: number;
    dismissible: boolean;
    variant: Variant;
    category: Category | Category[];
    content: Localization;
    headline?: Localization;
    cta?: CTA;
    modal?: Modal;
    /**
     * @minItems 1
     */
    feature?: Feature[];
    context?: Context;
}
/**
 * A multilingual text localization.
 *
 * This interface was referenced by `MessageSystem`'s JSON-Schema
 * via the `definition` "localization".
 */
export interface Localization {
    en: string;
    es: string;
    cs: string;
    de: string;
    fr: string;
    pt: string;
    [k: string]: string;
}
/**
 * Only used for 'banner' and 'context' categories.
 */
export interface CTA {
    action: CTAAction;
    link: string;
    anchor?: string;
    label: Localization;
}
/**
 * Only used for 'modal' category.
 */
export interface Modal {
    title: Localization;
    image: string;
}
/**
 * Only used for 'feature' category. Feature flag can disable a feature for a specific version of a specific app. Custom properties may be used to pass additional data to the feature flag.
 */
export interface Feature {
    domain: string;
    flag: boolean;
    /**
     * Optional payload with arbitrary properties
     */
    payload?: {
        [k: string]: unknown;
    };
    /**
     * Legacy field for 'dashboard.promoBanner'
     */
    visibleBanner?: string;
    /**
     * Legacy field for 'security.firmware.hashCheck.timeout'
     */
    timeoutThresholdsPerModel?: {
        [k: string]: unknown;
    } | null;
    /**
     * Legacy field for 'coinjoin'
     */
    averageAnonymityGainPerRound?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    roundsFailRateBuffer?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    roundsDurationInHours?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    maxMiningFeeModifier?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    maxFeePerVbyte?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    legalDocumentsVersion?: number;
    /**
     * Legacy field for 'coinjoin'
     */
    isPublic?: boolean;
}
/**
 * Only used for 'context' category.
 */
export interface Context {
    /**
     * The domain to which the message applies. Only used for 'context' category.
     */
    domain: string | string[];
}
export interface Experiments {
    conditions: Conditions;
    experiment: ExperimentsItem;
}
/**
 * Used for AB testing
 */
export interface ExperimentsItem {
    id: string;
    groups: {
        /**
         * The name of the variant, e.g., 'A' or 'B'
         */
        variant: string;
        /**
         * Percentage of users for this variant (0-100)
         */
        percentage: number;
        [k: string]: unknown;
    }[];
}
