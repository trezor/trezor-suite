import { type PlatformOSType } from 'react-native';

import { type AttributeDef, type EventDef } from '@suite-common/analytics';
import { type UNIT_ABBREVIATION } from '@suite-common/suite-constants';
import { type Locale } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { EventType } from '../constants';

type Attributes = {
    appLanguage: AttributeDef<string>;
    deviceLanguage?: AttributeDef<Locale>;
    localCurrency: AttributeDef<BaseCurrencyCode>;
    bitcoinUnit: AttributeDef<UNIT_ABBREVIATION>;
    screenWidth: AttributeDef<number>;
    screenHeight: AttributeDef<number>;
    pixelDensity: AttributeDef<number>;
    fontScale: AttributeDef<number>;
    osName: AttributeDef<PlatformOSType>;
    osVersion: AttributeDef<string | number>;
    discreetMode: AttributeDef<boolean>;
    theme: AttributeDef<'standard' | 'dark' | 'system' | 'debug'>;
    loadDuration: AttributeDef<number>;
    isBiometricsEnabled: AttributeDef<boolean>;
    rememberedStandardWallets: AttributeDef<number>;
    rememberedHiddenWallets: AttributeDef<number>;
    enabledNetworks: AttributeDef<NetworkSymbol[]>;
    labeling: AttributeDef<'suite-sync' | 'off'>;
};

export const appReadyEvent: EventDef<Attributes, EventType.AppReady> = {
    name: EventType.AppReady,
    descriptionTrigger: 'On the application start or when the onboarding is done.',
    changelog: [
        { version: '23.4.1', notes: 'added' },
        {
            version: '24.5.1',
            notes: 'params `rememberedStandardWallets` and `rememberedHiddenWallets` added',
        },
        { version: '24.7.2', notes: 'params `fontScale` and `pixelDensity` added' },
        { version: '24.9.1', notes: 'param `enabledNetworks` added' },
        {
            version: '26.2.1',
            notes: 'params `appLanguage` and `deviceLanguage` finally report real data.',
        },
        { version: '26.2.1', notes: 'param `labeling` added' },
    ],

    attributes: {
        appLanguage: {
            changelog: [
                { version: '23.4.1', notes: 'added' },
                {
                    version: '26.2.1',
                    notes: 'Finally report real data. Before this version there was always a hardcoded `en` value reported.',
                },
            ],
            description: 'The language of the app',
        },
        deviceLanguage: {
            changelog: [
                { version: '23.4.1', notes: 'added' },
                {
                    version: '26.2.1',
                    notes: 'Finally report real data. Before this version there was always a hardcoded `undefined` value reported.',
                },
            ],
            description: 'The language of the selected device',
        },
        localCurrency: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'Selected fiat currency',
        },
        bitcoinUnit: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'Selected bitcoin unit',
        },
        screenWidth: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
        },
        screenHeight: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
        },
        pixelDensity: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
        },
        fontScale: {
            changelog: [{ version: '24.7.2', notes: 'added' }],
        },
        osName: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'Operating system name',
        },
        osVersion: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'Operating system version',
        },
        discreetMode: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'Is discreet mode enabled?',
        },
        theme: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'The color theme of the app',
        },
        loadDuration: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
            description: 'The duration of the app to load in milliseconds',
        },
        isBiometricsEnabled: {
            changelog: [{ version: '24.4.1', notes: 'added' }],
        },
        rememberedStandardWallets: {
            changelog: [{ version: '24.5.1', notes: 'added' }],
            description: 'The number of remembered standard wallets',
        },
        rememberedHiddenWallets: {
            changelog: [{ version: '24.5.1', notes: 'added' }],
            description: 'The number of remembered hidden wallets',
        },
        enabledNetworks: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description: 'The symbols of the networks that are enabled',
        },
        labeling: {
            changelog: [{ version: '26.3.1', notes: 'added' }],
            description: "The labeling method: 'suite-sync' or 'off'",
        },
    },
};
