import { type Dispatch } from 'redux';

import { type TranslationFunction } from '@suite/intl';
import { openModal } from '@suite/modal';
import { suiteSettingsActions } from '@suite/settings';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';

import { type Command, CommandCategory } from './types';

type ActionCommandsParams = {
    dispatch: Dispatch;
    currentTheme: string;
    autodetectTheme: boolean;
    isBioAuthEnabled: boolean;
    translationString: TranslationFunction;
};

export const getActionCommands = ({
    dispatch,
    currentTheme,
    autodetectTheme,
    isBioAuthEnabled,
    translationString,
}: ActionCommandsParams): Command[] => [
    {
        id: 'action-toggle-theme',
        labelKey: 'TR_COMMAND_PALETTE_TOGGLE_THEME',
        description: currentTheme === 'dark' ? 'Switch to light' : 'Switch to dark',
        category: CommandCategory.Action,
        icon: currentTheme === 'dark' ? 'sun' : 'moon',
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'toggle'],
        shortcutHint: 'ALT+T',
        execute: () => {
            if (autodetectTheme) {
                dispatch(suiteSettingsActions.setAutodetect({ theme: false }));
            }

            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            dispatch(suiteSettingsActions.setTheme(newTheme));

            if (desktopApi.available) {
                desktopApi.themeChange(newTheme);
            }
        },
    },
    {
        id: 'action-biometric-lock',
        labelKey: 'TR_COMMAND_PALETTE_BIOMETRIC_LOCK',
        category: CommandCategory.Action,
        icon: 'fingerprint',
        keywords: ['biometric', 'lock', 'fingerprint', 'touch id', 'face id', 'bio'],
        shortcutHint: 'ALT+SHIFT+L',
        isAvailable: isDesktop(),
        execute: () => {
            if (!isBioAuthEnabled) {
                const messageSuccess = translationString(
                    isMacOs() ? 'TR_BIO_AUTH_SYSTEM_MESSAGE_MAC' : 'TR_BIO_AUTH_SYSTEM_MESSAGE_WIN',
                );
                const messageError = translationString('TR_BIO_AUTH_FAILED');
                dispatch(
                    requestBioAuthChangeThunk({
                        payload: true,
                        messageSuccess,
                        messageError,
                    }),
                );
            } else {
                dispatch(bioAuthActions.setCancelled(false));
                dispatch(bioAuthActions.setIsBioAuthValidationRequired(true));
            }
        },
    },
    {
        id: 'action-application-log',
        labelKey: 'TR_LOG',
        category: CommandCategory.Action,
        icon: 'bug',
        keywords: ['log', 'debug', 'application', 'console', 'error'],
        execute: () => dispatch(openModal({ type: 'application-log' })),
    },
];
