import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { UNIT_ABBREVIATION } from '@suite-common/suite-constants';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AppColorScheme } from '@suite-native/theme';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { EventType } from '../constants';

type Attributes = {
    appLanguage: AttributeDef<'en'>;
    deviceLanguage: AttributeDef<string | undefined>;
    localCurrency: AttributeDef<BaseCurrencyCode>;
    bitcoinUnit: AttributeDef<UNIT_ABBREVIATION>;
    screenWidth: AttributeDef<number>;
    screenHeight: AttributeDef<number>;
    pixelDensity: AttributeDef<number>;
    fontScale: AttributeDef<number>;
    osName: AttributeDef<'ios' | 'android' | 'windows' | 'macos' | 'web'>;
    osVersion: AttributeDef<string | number>;
    discreetMode: AttributeDef<boolean>;
    theme: AttributeDef<AppColorScheme>;
    loadDuration: AttributeDef<number>;
    isBiometricsEnabled: AttributeDef<boolean>;
    rememberedStandardWallets: AttributeDef<number>;
    rememberedHiddenWallets: AttributeDef<number>;
    enabledNetworks: AttributeDef<NetworkSymbol[]>;
};

export const appReadyEvent: EventDef<Attributes, EventType.AppReady> = {
    name: EventType.AppReady,
    descriptionTrigger:
        'On the application start but only if the app onboarding (Welcome flow) is done. Otherwise when leaving the app onboarding.',
    changelog: [
        { version: '23.4.1', notes: 'added' },
        {
            version: '24.5.1',
            notes: 'added rememberedStandardWallets, rememberedHiddenWallets',
        },
        { version: '24.7.2', notes: 'added fontScale, pixelDensity' },
        { version: '24.9.1', notes: 'added enabledNetworks' },
    ],
    attributes: {
        appLanguage: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Application language setting but so far only en is hardcoded.',
        },
        deviceLanguage: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Firmware language but so far only undefined is hardcoded.',
        },
        localCurrency: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'User preferred currency',
        },
        bitcoinUnit: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Bitcoin display unit (BTC, mBTC, sat)',
        },
        screenWidth: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Device screen width in pixels',
        },
        screenHeight: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Device screen height in pixels',
        },
        pixelDensity: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
            description: 'Device pixel density ratio',
        },
        fontScale: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
            description: 'System font scale setting',
        },
        osName: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Operating system name (ios or android)',
        },
        osVersion: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'OS version number',
        },
        discreetMode: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Whether discreet mode is enabled',
        },
        theme: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Current color scheme (debug/standard/dark/system)',
        },
        loadDuration: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Milliseconds from app start to ready state',
        },
        isBiometricsEnabled: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Whether biometrics authentication is enabled',
        },
        rememberedStandardWallets: {
            changelog: [{ version: '24.5.1', notes: 'added' }],
            description: 'Count of saved standard wallets',
        },
        rememberedHiddenWallets: {
            changelog: [{ version: '24.5.1', notes: 'added' }],
            description: 'Count of saved hidden wallets',
        },
        enabledNetworks: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description: 'List of enabled networks (btc, eth, etc.)',
        },
    },
};
