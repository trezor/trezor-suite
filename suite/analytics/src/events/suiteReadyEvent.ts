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
    descriptionTrigger:
        'Application finishes initialization and is ready for user interaction (either after startup or after onboarding completion)',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        { version: '25.9.0', notes: 'updated' },
    ],

    attributes: {
        language: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available Suite languages e.g. `en`',
        },
        enabledNetworks: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available suite coins e.g. `btc`, `ltc`',
        },
        localCurrency: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available suite currencies e.g. `usd`',
        },
        discreetMode: {
            description:
                'Whether discreet mode is enabled (hides sensitive information like amounts)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        screenWidth: {
            description: 'Device screen width in pixels',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        screenHeight: {
            description: 'Device screen height in pixels',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        platformLanguages: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: `Array of user's languages in browser/os`,
        },
        tor: {
            description: 'Whether Tor network support is enabled',
            changelog: [{ version: '1.2.0', notes: 'added' }],
        },
        rememberedStandardWallets: {
            description:
                'Number of standard (non-hidden) wallets that the user has set to be remembered',
            changelog: [{ version: '1.4.0', notes: 'added' }],
        },
        rememberedHiddenWallets: {
            description:
                'Number of hidden wallets (created with passphrases) that the user has set to be remembered',
            changelog: [{ version: '1.4.0', notes: 'added' }],
        },
        theme: {
            changelog: [{ version: '1.5.0', notes: 'added' }],
            description: 'dark, light, debug',
        },
        suiteVersion: {
            description: 'The version of Suite that is running',
            changelog: [{ version: '1.6.0', notes: 'added' }],
        },
        windowWidth: {
            description: 'Window width in pixels (for desktop app)',
            changelog: [{ version: '1.8.0', notes: 'added' }],
        },
        windowHeight: {
            description: 'Window height in pixels (for desktop app)',
            changelog: [{ version: '1.8.0', notes: 'added' }],
        },
        osVersion: {
            description: 'Operating system version',
            changelog: [{ version: '1.8.0', notes: 'added' }],
        },
        osName: {
            changelog: [{ version: '1.8.0', notes: 'added' }],
            description: 'windows, macos, linux, android, chromeos, ios',
        },
        osCpuArch: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'CPU architecture (e.g., `amd64`, `arm64`)',
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
            description: 'boolean - `true` only on Desktop app with Early Access Program active',
        },
        customBackends: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: 'Available suite coins e.g. `btc`, `ltc`',
        },
        autodetectLanguage: {
            description: 'Whether automatic language detection from system settings is enabled',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        autodetectTheme: {
            description:
                'Whether automatic theme detection from system settings (light/dark mode) is enabled',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        labeling: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description: `'dropbox' | 'google' | 'fileSystem' | 'inMemoryTest' | 'suite-sync' | 'missing-provider' | 'off' - labeling provider used for fetching transaction labels (if any)`,
        },
        bitcoinUnit: {
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description: `Bitcoin unit abbreviation (e.g., 'BTC', 'mBTC', 'μBTC', 'sat')`,
        },
        experimentalFeatures: {
            changelog: [{ version: '24.8.0', notes: 'added' }],
            description: 'list of active experimental features as strings',
        },
        isAutomaticUpdateEnabled: {
            description: 'Whether automatic app updates are enabled (desktop app)',
            changelog: [{ version: '25.1.0', notes: 'added' }],
        },
        experimentVariants: {
            description: 'List of active experiment variant identifiers',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        mevProtection: {
            description: 'Whether MEV (Maximum Extractable Value) protection is enabled',
            changelog: [{ version: '25.10.0', notes: 'added' }],
        },
        networkReserve: {
            description: 'Whether network reserve fee protection is enabled',
            changelog: [{ version: '25.10.0', notes: 'added' }],
        },
    },
};
