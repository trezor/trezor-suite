import { useEffect, useRef } from 'react';

import { useTranslation } from '@suite/intl';
import { closeModalApp, goto } from '@suite/router';
import { selectAutodetectTheme, selectTheme, suiteSettingsActions } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { useDiscreetMode } from '@suite-common/discreet-mode';
import { selectAllAccountsToList, startDiscoveryThunk } from '@suite-common/wallet-core';
import { KEYBOARD_CODE } from '@trezor/components';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

export const AppShortcuts = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus?.status === 'loading';

    const accounts = useSelector(selectAllAccountsToList);
    const currentTheme = useSelector(selectTheme);
    const autodetectTheme = useSelector(selectAutodetectTheme);

    const isBioAuthEnabled = useSelector(state => state.bioAuth.bioAuthEnabled);
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();
    const { translationString } = useTranslation();

    const handleKeyDown = (e: KeyboardEvent) => {
        const { altKey, metaKey, ctrlKey, shiftKey } = e;
        const isDeviceSelected = selectedDevice !== undefined;
        const cmdOrCtrl = metaKey || ctrlKey;

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

        // press CMD/CTRL + , to show Settings
        if (
            cmdOrCtrl &&
            !altKey &&
            !shiftKey &&
            e.code === KEYBOARD_CODE.COMMA &&
            isDeviceSelected
        ) {
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
                            symbol: account?.symbol,
                            accountIndex: account?.index,
                            accountType: account?.accountType,
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

        // press ALT + R to open receive flow
        if (altKey && e.code === KEYBOARD_CODE.KEY_R && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'suite-index', params: { modal: 'receive' } }));
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

        // press ALT + H to toggle balances visibility (discreet mode)
        if (altKey && !shiftKey && !cmdOrCtrl && e.code === KEYBOARD_CODE.KEY_H) {
            e.preventDefault();
            setIsDiscreetMode(!isDiscreetMode);
        }

        // press CMD/CTRL + K to focus account search
        if (cmdOrCtrl && e.code === KEYBOARD_CODE.KEY_K) {
            e.preventDefault();
            const searchInput = document.querySelector<HTMLInputElement>(
                '[data-testid="@account-menu/search-input"]',
            );
            searchInput?.focus();
        }
    };

    // Keep a stable listener that always calls the latest handler, and listen in the capture
    // phase so the shortcut fires before any descendant (charts, dropdowns, …) can swallow the
    // event by stopping its propagation.
    const handleKeyDownRef = useRef(handleKeyDown);
    handleKeyDownRef.current = handleKeyDown;

    useEffect(() => {
        const listener = (event: KeyboardEvent) => handleKeyDownRef.current(event);

        window.addEventListener('keydown', listener, { capture: true });

        return () => window.removeEventListener('keydown', listener, { capture: true });
    }, []);

    return null;
};
