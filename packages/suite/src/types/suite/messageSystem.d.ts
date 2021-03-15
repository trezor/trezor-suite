/**
 * DO NOT MODIFY BY HAND! This file was automatically generated.
 * Instead, please modify the original JSONSchema file in suite-data package, and run `npm run message-system-types` command.
 */

export type Version = string | string[] | null;
export type Model = 't' | '1';
/**
 * Eligible authorized vendors.
 */
export type Vendor = 'SatoshiLabs';
export type Condition = {
    settings: Settings[];
    os: OperatingSystem;
    environment: Environment;
    browser: Browser;
    transport: Transport;
    devices: Device[];
}[];
export type Variant = 'info' | 'warning' | 'critical';
export type Category = 'banner' | 'context' | 'modal';
/**
 * The domain to which the message applies. Wildcards are allowed. Only used for 'context' category.
 */
export type Domain = string | string[];

/**
 * JSON schema of the Trezor Suite messaging system.
 */
export interface MessageSystem {
    /**
     * A version of the messaging system. In case we would change the format of the config itself.
     */
    version: number;
    /**
     * Publish date of the config in ISO 8601 date-time format.
     */
    timestamp: string;
    /**
     * An increasing counter. Trezor Suite must decline any sequence lower than the latest number. This is to protect against replay attacks, where an attacker could send an older version of the file, and Trezor Suite would accept it.
     */
    sequence: number;
    actions: Action[];
}
export interface Action {
    conditions: Condition;
    message: Message;
}
/**
 * If a setting is not specified, then it can be either true or false. Currently, 'tor' and coin symbols are supported.
 */
export interface Settings {
    tor?: boolean;
    [k: string]: boolean;
}
export interface OperatingSystem {
    macos: Version;
    linux: Version;
    windows: Version;
    android: Version;
    ios: Version;
    [k: string]: Version;
}
export interface Environment {
    desktop: Version;
    mobile: Version;
    web: Version;
}
export interface Browser {
    firefox: Version;
    chrome: Version;
    chromium: Version;
    [k: string]: Version;
}
export interface Transport {
    bridge: Version;
}
export interface Device {
    model: Model;
    firmware: Version;
    vendor: Vendor;
}
export interface Message {
    id: string;
    active: boolean;
    priority: number;
    dismissible: boolean;
    variant: Variant;
    category: Category | Category[];
    content: Localization;
    cta?: CTA;
    modal?: Modal;
    domain?: Domain;
}
/**
 * A multilingual text localization.
 */
export interface Localization {
    'en-GB': string;
    [k: string]: string;
}
/**
 * Only used for 'banner' and 'context' categories.
 */
export interface CTA {
    action: 'internal-link' | 'external-link';
    href: string;
    label: Localization;
}
/**
 * Only used for 'modal' category.
 */
export interface Modal {
    title?: Localization;
    image?: string;
}
