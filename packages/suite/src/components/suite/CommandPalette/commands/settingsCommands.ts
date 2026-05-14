import { type Dispatch } from 'redux';

import { type TranslationKey } from '@suite/intl';
import { SettingsAnchor, type SettingsAnchorValue, goto, mapAnchorToRoute } from '@suite/router';

import { type Command, CommandCategory } from './types';

type SettingsCommandConfig = {
    anchorKey: keyof typeof SettingsAnchor;
    labelKey: TranslationKey;
    keywords: string[];
};

const settingsCommandConfigs: SettingsCommandConfig[] = [
    {
        anchorKey: 'Language',
        labelKey: 'TR_LANGUAGE',
        keywords: ['language', 'locale', 'translation'],
    },
    {
        anchorKey: 'Fiat',
        labelKey: 'TR_CURRENCY',
        keywords: ['fiat', 'currency', 'usd', 'eur'],
    },
    {
        anchorKey: 'BitcoinAmountUnit',
        labelKey: 'TR_BTC_UNITS',
        keywords: ['bitcoin', 'amount', 'unit', 'satoshi', 'btc'],
    },
    {
        anchorKey: 'Labeling',
        labelKey: 'TR_LABELING',
        keywords: ['labeling', 'labels', 'metadata', 'names'],
    },
    {
        anchorKey: 'Tor',
        labelKey: 'TR_TOR_TITLE',
        keywords: ['tor', 'privacy', 'anonymity', 'onion'],
    },
    {
        anchorKey: 'Theme',
        labelKey: 'TR_COLOR_SCHEME',
        keywords: ['theme', 'dark', 'light', 'appearance', 'mode', 'color', 'scheme'],
    },
    {
        anchorKey: 'AddressDisplay',
        labelKey: 'TR_ADDRESS_DISPLAY',
        keywords: ['address', 'display', 'format', 'chunked'],
    },
    {
        anchorKey: 'Analytics',
        labelKey: 'TR_ALLOW_ANALYTICS',
        keywords: ['analytics', 'tracking', 'data', 'usage'],
    },
    {
        anchorKey: 'ShowLog',
        labelKey: 'TR_LOG',
        keywords: ['log', 'debug', 'application', 'console'],
    },
    {
        anchorKey: 'ClearStorage',
        labelKey: 'TR_CLEAR_STORAGE',
        keywords: ['clear', 'storage', 'reset', 'cache', 'data'],
    },
    {
        anchorKey: 'VersionWithUpdate',
        labelKey: 'TR_FIRMWARE_VERSION',
        keywords: ['version', 'update', 'firmware', 'suite'],
    },
    {
        anchorKey: 'AutoEject',
        labelKey: 'TR_AUTO_EJECT',
        keywords: ['auto', 'eject', 'disconnect'],
    },
    {
        anchorKey: 'MevProtection',
        labelKey: 'TR_MEV',
        keywords: ['mev', 'protection', 'ethereum', 'front-running'],
    },
    {
        anchorKey: 'DustPhishing',
        labelKey: 'TR_DUST_PHISHING_PROTECTION',
        keywords: ['dust', 'phishing', 'protection', 'spam'],
    },
    {
        anchorKey: 'BackupRecoverySeed',
        labelKey: 'TR_BACKUP_RECOVERY_SEED',
        keywords: ['backup', 'recovery', 'seed', 'mnemonic'],
    },
    {
        anchorKey: 'CheckRecoverySeed',
        labelKey: 'TR_CHECK_RECOVERY_SEED',
        keywords: ['check', 'verify', 'recovery', 'seed'],
    },
    {
        anchorKey: 'FirmwareVersion',
        labelKey: 'TR_FIRMWARE_VERSION',
        keywords: ['firmware', 'version', 'update', 'device'],
    },
    {
        anchorKey: 'PinProtection',
        labelKey: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE',
        keywords: ['pin', 'protection', 'security', 'code'],
    },
    {
        anchorKey: 'ChangePin',
        labelKey: 'TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE',
        keywords: ['change', 'pin', 'update', 'security'],
    },
    {
        anchorKey: 'Passphrase',
        labelKey: 'TR_DEVICE_SETTINGS_PASSPHRASE_TITLE',
        keywords: ['passphrase', 'hidden', 'wallet', 'password'],
    },
    {
        anchorKey: 'SafetyChecks',
        labelKey: 'TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE',
        keywords: ['safety', 'checks', 'security', 'advanced'],
    },
    {
        anchorKey: 'DeviceLabel',
        labelKey: 'TR_DEVICE_SETTINGS_DEVICE_LABEL',
        keywords: ['device', 'label', 'name', 'rename'],
    },
    {
        anchorKey: 'Homescreen',
        labelKey: 'TR_DEVICE_SETTINGS_HOMESCREEN_TITLE',
        keywords: ['homescreen', 'wallpaper', 'image', 'display'],
    },
    {
        anchorKey: 'DisplayRotation',
        labelKey: 'TR_DEVICE_SETTINGS_DISPLAY_ROTATION',
        keywords: ['display', 'rotation', 'screen', 'orientation'],
    },
    {
        anchorKey: 'Autolock',
        labelKey: 'TR_DEVICE_SETTINGS_AFTER_DELAY',
        keywords: ['autolock', 'auto', 'lock', 'timeout', 'delay'],
    },
    {
        anchorKey: 'WipeDevice',
        labelKey: 'TR_DEVICE_SETTINGS_WIPE_DEVICE',
        keywords: ['wipe', 'device', 'reset', 'factory', 'erase'],
    },
    {
        anchorKey: 'Crypto',
        labelKey: 'TR_COINS',
        keywords: ['crypto', 'coins', 'networks', 'enable', 'disable', 'activate'],
    },
];

const getAnchorSection = (anchor: SettingsAnchorValue): string => {
    const match = anchor.match(/^@([^/]+)\//);

    return match?.[1] ?? 'general-settings';
};

export const getSettingsCommands = (dispatch: Dispatch): Command[] =>
    settingsCommandConfigs.map(config => {
        const anchor = SettingsAnchor[config.anchorKey];
        const section = getAnchorSection(anchor);
        const routeName =
            mapAnchorToRoute[section as keyof typeof mapAnchorToRoute] ?? 'settings-index';

        return {
            id: `settings-${config.anchorKey}`,
            labelKey: config.labelKey,
            category: CommandCategory.Settings,
            icon: 'gear',
            keywords: [...config.keywords, 'settings'],
            execute: () => dispatch(goto({ routeName, anchor: config.anchorKey })),
        };
    });
