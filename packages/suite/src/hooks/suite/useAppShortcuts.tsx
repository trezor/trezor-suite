import { useEffect, useMemo, useRef } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { useToggleDebugMode } from '@suite/debug';
import { openModal } from '@suite/modal';
import { SettingsAnchor, closeModalApp, goto } from '@suite/router';
import { selectAutodetectTheme, selectTheme, suiteSettingsActions } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { useDiscreetMode } from '@suite-common/discreet-mode';
import { selectAllAccountsToList, startDiscoveryThunk } from '@suite-common/wallet-core';
import { KEYBOARD_CODE } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import { open, setView } from 'src/actions/suite/guideActions';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsBioAuthEnabled } from 'src/reducers/bioAuth';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

type ListedAccount = ReturnType<typeof selectAllAccountsToList>[number];

// Account-group order as rendered in the sidebar (see AccountsList.tsx), so that the
// digit / arrow account shortcuts step through accounts in the same order the user sees.
const SIDEBAR_ACCOUNT_TYPE_ORDER = ['coinjoin', 'normal', 'taproot', 'segwit', 'legacy', 'ledger'];

const sidebarTypeRank = (accountType: string) => {
    const rank = SIDEBAR_ACCOUNT_TYPE_ORDER.indexOf(accountType);

    return rank === -1 ? SIDEBAR_ACCOUNT_TYPE_ORDER.length : rank;
};

// `?` is a printable character, so the shortcut must not hijack typing in form fields.
const isTypingTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;

    const { tagName, isContentEditable } = target;

    return isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
};

export const useAppShortcuts = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus?.status === 'loading';

    const accounts = useSelector(selectAllAccountsToList);
    const selectedAccount = useSelector(selectSelectedAccount);
    // Stable sort keeps the per-group order from the selector while matching the sidebar grouping.
    const orderedAccounts = useMemo(
        () =>
            [...accounts].sort(
                (a, b) => sidebarTypeRank(a.accountType) - sidebarTypeRank(b.accountType),
            ),
        [accounts],
    );
    const currentTheme = useSelector(selectTheme);
    const autodetectTheme = useSelector(selectAutodetectTheme);

    const isBioAuthEnabled = useSelector(selectIsBioAuthEnabled);
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();
    const toggleDebugMode = useToggleDebugMode();

    const handleKeyDown = (e: KeyboardEvent) => {
        const { altKey, metaKey, ctrlKey, shiftKey } = e;
        const isDeviceSelected = selectedDevice !== undefined;
        const cmdOrCtrl = metaKey || ctrlKey;
        // Most shortcuts use ALT alone; exclude the other modifiers to avoid clashes.
        const altOnly = altKey && !shiftKey && !cmdOrCtrl;

        const gotoAccount = (account: ListedAccount | undefined) =>
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

        // press CMD/CTRL + , to open Settings
        if (
            cmdOrCtrl &&
            !altKey &&
            !shiftKey &&
            e.code === KEYBOARD_CODE.COMMA &&
            isDeviceSelected
        ) {
            e.preventDefault();
            dispatch(goto({ routeName: 'settings-index' }));
        }

        // press ALT + P to open a passphrase (hidden) wallet
        if (altOnly && e.code === KEYBOARD_CODE.KEY_P && selectedDevice?.connected) {
            e.preventDefault();
            dispatch(closeModalApp());
            dispatch(
                startDiscoveryThunk({
                    device: selectedDevice,
                    isAddingHiddenWallet: true,
                    isAddingExistingWallet: true,
                }),
            );
        }

        // press ALT + W to open the wallet/device switcher
        if (altOnly && e.code === KEYBOARD_CODE.KEY_W && isDeviceSelected) {
            e.preventDefault();
            if (!discoveryInProgress) {
                dispatch(goto({ routeName: 'suite-switch-device', params: { cancelable: true } }));
            }
        }

        // press CMD/CTRL + K to focus the account search
        if (cmdOrCtrl && !altKey && !shiftKey && e.code === KEYBOARD_CODE.KEY_K) {
            e.preventDefault();
            document
                .querySelector<HTMLInputElement>('[data-testid="@account-menu/search-input"]')
                ?.focus();
        }

        // press ALT + A to add a new account
        if (altOnly && e.code === KEYBOARD_CODE.KEY_A && selectedDevice) {
            e.preventDefault();
            dispatch(openModal({ type: 'add-account', device: selectedDevice }));
        }

        // press ALT + T to toggle dark/light theme
        if (altOnly && e.code === KEYBOARD_CODE.KEY_T) {
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
        if (altOnly && e.code === KEYBOARD_CODE.KEY_H) {
            e.preventDefault();
            setIsDiscreetMode(!isDiscreetMode);
        }

        // press ALT + L to lock the app with biometric auth (desktop only)
        if (altOnly && e.code === KEYBOARD_CODE.KEY_L && isDesktop()) {
            e.preventDefault();

            if (!isBioAuthEnabled) {
                // Biometric lock isn't set up yet, so there's nothing to lock with.
                // Take the user to the setting and highlight it instead.
                dispatch(goto({ routeName: 'settings-index', anchor: SettingsAnchor.BioAuth }));
            } else {
                dispatch(bioAuthActions.setCancelled(false));
                dispatch(bioAuthActions.setIsBioAuthValidationRequired(true));
            }
        }

        // press ALT + S to open the send flow
        if (altOnly && e.code === KEYBOARD_CODE.KEY_S && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'suite-index', params: { modal: 'send' } }));
        }

        // press ALT + R to open the receive flow
        if (altOnly && e.code === KEYBOARD_CODE.KEY_R && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'suite-index', params: { modal: 'receive' } }));
        }

        // press ALT + X to open Swap (exchange)
        if (altOnly && e.code === KEYBOARD_CODE.KEY_X && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'wallet-trading-exchange', preserveParams: false }));
        }

        // press ALT + B to open Buy
        if (altOnly && e.code === KEYBOARD_CODE.KEY_B && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'wallet-trading-buy', preserveParams: false }));
        }

        // press ALT + C to open Sell
        if (altOnly && e.code === KEYBOARD_CODE.KEY_C && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'wallet-trading-sell', preserveParams: false }));
        }

        // press ALT + E to open Earn
        if (altOnly && e.code === KEYBOARD_CODE.KEY_E && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'suite-earn' }));
        }

        // press ALT + N to open Networks (coin settings)
        if (altOnly && e.code === KEYBOARD_CODE.KEY_N && isDeviceSelected) {
            e.preventDefault();
            dispatch(goto({ routeName: 'settings-coins' }));
        }

        // press ALT + I to toggle the notifications (activity) dropdown in the sidebar
        if (altOnly && e.code === KEYBOARD_CODE.KEY_I) {
            e.preventDefault();
            document
                .querySelector<HTMLElement>('[data-testid="@suite/menu/notifications"]')
                ?.click();
        }

        // press ALT + 0 to open the Dashboard, ALT + 1-9 to quick-switch between accounts
        if (altOnly && isDeviceSelected) {
            if (e.code === KEYBOARD_CODE.DIGIT_ZERO) {
                e.preventDefault();
                dispatch(goto({ routeName: 'suite-index' }));
            }

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
            if (accountIndex !== -1 && accountIndex < orderedAccounts.length) {
                e.preventDefault();
                gotoAccount(orderedAccounts[accountIndex]);
            }
        }

        // press ALT + ↑ / ↓ to step to the previous / next account in the list
        if (
            altOnly &&
            (e.code === KEYBOARD_CODE.ARROW_UP || e.code === KEYBOARD_CODE.ARROW_DOWN) &&
            orderedAccounts.length > 0
        ) {
            e.preventDefault();
            const offset = e.code === KEYBOARD_CODE.ARROW_DOWN ? 1 : -1;
            const currentIndex = orderedAccounts.findIndex(
                account =>
                    selectedAccount?.symbol === account.symbol &&
                    selectedAccount?.index === account.index &&
                    selectedAccount?.accountType === account.accountType,
            );
            // When no account is selected yet, ↓ starts at the first and ↑ at the last one.
            const fallbackBase = offset === 1 ? -1 : 0;
            const base = currentIndex === -1 ? fallbackBase : currentIndex;
            const nextIndex = (base + offset + orderedAccounts.length) % orderedAccounts.length;
            gotoAccount(orderedAccounts[nextIndex]);
        }

        // press CMD/CTRL + ALT + SHIFT + D to toggle the debug mode
        if (cmdOrCtrl && altKey && shiftKey && e.code === KEYBOARD_CODE.KEY_D) {
            e.preventDefault();
            toggleDebugMode();
        }

        // press ? to open the keyboard shortcuts guide
        // `?` is a printable character, so ignore it while the user is typing
        if (e.key === '?' && !cmdOrCtrl && !altKey && !isTypingTarget(e.target)) {
            e.preventDefault();
            dispatch(setView('KEYBOARD_SHORTCUTS'));
            dispatch(open());
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
};
