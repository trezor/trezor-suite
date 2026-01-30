import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { MetadataProviderType } from '@suite-common/metadata-types';

import { EventType } from '../constants';

type Attributes = {
    language: AttributeDef<string>;
    enabledNetworks: AttributeDef<string[]>;
    customBackends: AttributeDef<string[]>;
    localCurrency: AttributeDef<string>;
    bitcoinUnit: AttributeDef<string>;
    discreetMode: AttributeDef<boolean>;
    screenWidth: AttributeDef<number>;
    screenHeight: AttributeDef<number>;
    platformLanguages: AttributeDef<string>;
    tor: AttributeDef<boolean>;
    rememberedStandardWallets: AttributeDef<number>;
    rememberedHiddenWallets: AttributeDef<number>;
    theme: AttributeDef<string>;
    suiteVersion: AttributeDef<string>;
    windowWidth: AttributeDef<number>;
    windowHeight: AttributeDef<number>;
    osVersion: AttributeDef<string>;
    osName: AttributeDef<string>;
    osCpuArch: AttributeDef<string>;
    browserVersion: AttributeDef<string>;
    browserName: AttributeDef<string>;
    earlyAccessProgram: AttributeDef<boolean>;
    autodetectLanguage: AttributeDef<boolean>;
    autodetectTheme: AttributeDef<boolean>;
    labeling: AttributeDef<MetadataProviderType | 'missing-provider' | 'suite-sync' | 'off'>;
    experimentalFeatures?: AttributeDef<string[]>;
    isAutomaticUpdateEnabled: AttributeDef<boolean>;
    experimentVariants: AttributeDef<string[]>;
    mevProtection: AttributeDef<boolean>;
    networkReserve: AttributeDef<boolean>;
};

export const suiteReadyEvent: EventDef<Attributes, EventType.SuiteReady> = {
    name: EventType.SuiteReady,
    descriptionTrigger: 'Triggers on the application start or when the onboarding is done.',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        { version: '25.9.0', notes: 'updated' },
    ],

    attributes: {
        language: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available Suite languages e.g. "en"',
        },
        enabledNetworks: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available suite coins e.g. "btc,ltc,doge"',
        },
        localCurrency: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available suite currencies e.g. "usd"',
        },
        discreetMode: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        screenWidth: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        screenHeight: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        platformLanguages: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: "Array of user's languages in browser/os",
        },
        tor: { changelog: [{ version: '1.2.0', notes: 'added' }] },
        rememberedStandardWallets: { changelog: [{ version: '1.4.0', notes: 'added' }] },
        rememberedHiddenWallets: { changelog: [{ version: '1.4.0', notes: 'added' }] },
        theme: {
            changelog: [{ version: '1.5.0', notes: 'added' }],
            description: 'dark, light, custom',
        },
        suiteVersion: { changelog: [{ version: '1.6.0', notes: 'added' }] },
        windowWidth: { changelog: [{ version: '1.8.0', notes: 'added' }] },
        windowHeight: { changelog: [{ version: '1.8.0', notes: 'added' }] },
        osVersion: { changelog: [{ version: '1.8.0', notes: 'added' }] },
        osName: {
            changelog: [{ version: '1.8.0', notes: 'added' }],
            description: 'windows, macos, linux, android, chromeos',
        },
        osCpuArch: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'amd64, arm64',
        },
        browserVersion: {
            changelog: [{ version: '1.8.0', notes: 'added' }],
            description: 'Version of browser in semver format',
        },
        browserName: {
            changelog: [{ version: '1.8.0', notes: 'added' }],
            description: 'chrome, firefox, electron',
        },
        earlyAccessProgram: {
            changelog: [{ version: '1.15.0', notes: 'added' }],
            description: 'boolean - true only on Desktop app with Early Access Program active',
        },
        customBackends: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: 'Available suite coins e.g. "btc,ltc,doge"',
        },
        autodetectLanguage: { changelog: [{ version: '1.17.0', notes: 'added' }] },
        autodetectTheme: { changelog: [{ version: '1.17.0', notes: 'added' }] },
        labeling: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description: "'dropbox' | 'google' | 'fileSystem' | 'sdCard' | ''",
        },
        bitcoinUnit: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description: "'BTC' | 'μBTC' | 'mBTC' | 'sat'",
        },
        experimentalFeatures: {
            changelog: [{ version: '24.8.0', notes: 'added' }],
            description: 'list of active experimental features as strings',
        },
        isAutomaticUpdateEnabled: { changelog: [{ version: '25.1.0', notes: 'added' }] },
        experimentVariants: { changelog: [{ version: '25.9.0', notes: 'added' }] },
        mevProtection: { changelog: [{ version: '25.10.0', notes: 'added' }] },
        networkReserve: { changelog: [{ version: '25.10.0', notes: 'added' }] },
    },
};
