/**
 * DO NOT MODIFY BY HAND! This file was automatically generated.
 * Instead, modify the original JSONSchema file in /message-system/schema, and run yarn build:libs.
 */

/**
 * ISO 8601 date-time format.
 */
export type DateTime = string;
export type Version = string | string[];
export type Model = '1' | 'T' | 'T1B1' | 'T2T1' | 'T2B1' | 'Safe 3' | '';
export type FirmwareRevision = string;
export type FirmwareVariant = '*' | 'bitcoin-only' | 'regular';
/**
 * Eligible authorized vendors.
 */
export type Vendor = '*' | 'trezor.io';
export type Variant = 'info' | 'warning' | 'critical';
export type Category = 'banner' | 'context' | 'modal' | 'feature';

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
}
export interface Action {
    conditions: Condition[];
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
}
export interface Message {
    id: string;
    priority: number;
    dismissible: boolean;
    variant: Variant;
    category: Category | Category[];
    content: Localization;
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
 */
export interface Localization {
    'en-GB': string;
    en: string;
    es: string;
    cs: string;
    ru: string;
    ja: string;
    fr: string;
    [k: string]: string;
}
/**
 * Only used for 'banner' and 'context' categories.
 */
export interface CTA {
    action: 'internal-link' | 'external-link';
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
 * Only used for 'feature' category. Feature flag can disable a feature for a specific version of a specific app.
 */
export interface Feature {
    domain: string;
    flag: boolean;
    isPublic?: boolean;
    [k: string]: unknown;
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
