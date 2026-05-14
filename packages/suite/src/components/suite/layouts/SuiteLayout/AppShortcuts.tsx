import { useEvent } from 'react-use';

import { useTranslation } from '@suite/intl';
import { closeModalApp, goto } from '@suite/router';
import { selectAutodetectTheme, selectTheme, suiteSettingsActions } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAllAccountsToList, startDiscoveryThunk } from '@suite-common/wallet-core';
import { KEYBOARD_CODE } from '@trezor/components';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';
import { useCommandPalette } from 'src/components/suite/CommandPalette/CommandPaletteProvider';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsBioAuthEnabled } from 'src/reducers/bioAuth';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

export const AppShortcuts = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress =
        discoveryStatus !== undefined && discoveryStatus.status === 'loading';

    const accounts = useSelector(selectAllAccountsToList);
    const currentTheme = useSelector(selectTheme);
    const autodetectTheme = useSelector(selectAutodetectTheme);

    const isBioAuthEnabled = useSelector(selectIsBioAuthEnabled);
    const { translationString } = useTranslation();
    const commandPalette = useCommandPalette();

    useEvent('keydown', e => {
        const { altKey, metaKey, ctrlKey, shiftKey } = e;
        const isDeviceSelected = selectedDevice !== undefined;
        const cmdOrCtrl = metaKey || ctrlKey;

        // press ALT + Space to toggle Command Palette
        if (altKey && !shiftKey && !cmdOrCtrl && e.code === KEYBOARD_CODE.SPACE) {
            e.preventDefault();
            commandPalette.toggle();
        }

        // press ALT + P to show PassphraseModal
        if (
            selectedDevice?.connected &&
            (altKey || metaKey) &&
            e.code === KEYBOARD_CODE.KEY_P &&
            isDeviceSelected
        ) {
            dispatch(closeModalApp());
            e.preventDefault();
            dispatch(
                startDiscoveryThunk({
                    device: selectedDevice,
                    isAddingHiddenWallet: true,
                    isAddingExistingWallet: true,
                }),
            );
        }

        // press ALT + D to show SwitchDevice
        if (altKey && e.code === KEYBOARD_CODE.KEY_D && isDeviceSelected) {
            if (!discoveryInProgress) {
                dispatch(goto({ routeName: 'suite-switch-device', params: { cancelable: true } }));
            }

            // Firefox has default ALT+D shortcut to open address bar so we want to prevent that
            // anyway (even when we are doing nothing due to running discovery) to avoid inconsistent behavior
            e.preventDefault();
        }

        // press CMD + , to show Settings
        if (metaKey && e.code === KEYBOARD_CODE.COMMA && isDeviceSelected) {
            dispatch(goto({ routeName: 'settings-index' }));
            e.preventDefault();
        }

        // press ALT + SHIFT + L to lock the app with biometric auth (desktop only)
        if (altKey && shiftKey && e.code === KEYBOARD_CODE.KEY_L && isDesktop()) {
            e.preventDefault();

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
        }

        // press CMD/CTRL + 1-9 to quick-switch between accounts
        if (cmdOrCtrl && !shiftKey && !altKey && isDeviceSelected) {
            const digitCodes: string[] = [
                KEYBOARD_CODE.DIGIT_ONE,
                KEYBOARD_CODE.DIGIT_TWO,
                KEYBOARD_CODE.DIGIT_THREE,
                KEYBOARD_CODE.DIGIT_FOUR,
                KEYBOARD_CODE.DIGIT_FIVE,
                KEYBOARD_CODE.DIGIT_SIX,
                KEYBOARD_CODE.DIGIT_SEVEN,
                KEYBOARD_CODE.DIGIT_EIGHT,
                KEYBOARD_CODE.DIGIT_NINE,
            ];

            const accountIndex = digitCodes.indexOf(e.code);
            if (accountIndex !== -1 && accountIndex < accounts.length) {
                const account = accounts[accountIndex];
                e.preventDefault();
                dispatch(
                    goto({
                        routeName: 'wallet-index',
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    }),
                );
            }
        }

        // press ALT + S to open send flow
        if (altKey && e.code === KEYBOARD_CODE.KEY_S && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'suite-index', params: { modal: 'send' } }));
        }

        // press ALT + T to toggle dark/light theme
        if (altKey && !shiftKey && !cmdOrCtrl && e.code === KEYBOARD_CODE.KEY_T) {
            e.preventDefault();

            if (autodetectTheme) {
                dispatch(suiteSettingsActions.setAutodetect({ theme: false }));
            }

            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            dispatch(suiteSettingsActions.setTheme(newTheme));

            if (desktopApi.available) {
                desktopApi.themeChange(newTheme);
            }
        }

        // press CMD/CTRL + K to focus account search
        if (cmdOrCtrl && e.code === KEYBOARD_CODE.KEY_K) {
            e.preventDefault();
            const searchInput = document.querySelector<HTMLInputElement>(
                '[data-testid="@account-menu/search-input"]',
            );
            searchInput?.focus();
        }
    });

    return null;
};
