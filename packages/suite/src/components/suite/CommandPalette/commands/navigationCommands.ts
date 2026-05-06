import { type Dispatch } from 'redux';

import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { type Command, CommandCategory } from './types';

type NavigationCommandsParams = {
    dispatch: Dispatch;
    selectedAccount: Account | undefined;
};

export const getNavigationCommands = ({
    dispatch,
    selectedAccount,
}: NavigationCommandsParams): Command[] => {
    const accountParams = selectedAccount
        ? {
              symbol: selectedAccount.symbol,
              accountIndex: selectedAccount.index,
              accountType: selectedAccount.accountType,
          }
        : undefined;

    return [
        {
            id: 'nav-dashboard',
            labelKey: 'TR_DASHBOARD',
            category: CommandCategory.Navigation,
            icon: 'house',
            keywords: ['dashboard', 'home', 'overview'],
            execute: () => dispatch(goto({ routeName: 'suite-index' })),
        },
        {
            id: 'nav-settings',
            labelKey: 'TR_SETTINGS',
            category: CommandCategory.Navigation,
            icon: 'gear',
            keywords: ['settings', 'preferences', 'configuration'],
            shortcutHint: 'CMD+,',
            execute: () => dispatch(goto({ routeName: 'settings-index' })),
        },
        {
            id: 'nav-settings-device',
            labelKey: 'TR_COMMAND_PALETTE_DEVICE_SETTINGS',
            category: CommandCategory.Navigation,
            icon: 'gear',
            keywords: ['device', 'settings', 'trezor', 'hardware'],
            execute: () => dispatch(goto({ routeName: 'settings-device' })),
        },
        {
            id: 'nav-settings-coins',
            labelKey: 'TR_COINS',
            category: CommandCategory.Navigation,
            icon: 'coin',
            keywords: ['coins', 'networks', 'crypto', 'enable', 'disable', 'activate'],
            execute: () => dispatch(goto({ routeName: 'settings-coins' })),
        },
        {
            id: 'nav-send',
            labelKey: 'TR_NAV_SEND',
            category: CommandCategory.Navigation,
            icon: 'arrowUp',
            keywords: ['send', 'transfer', 'pay'],
            shortcutHint: 'ALT+S',
            isAvailable: !!accountParams,
            execute: () => {
                if (accountParams) {
                    dispatch(goto({ routeName: 'wallet-send', params: accountParams }));
                }
            },
        },
        {
            id: 'nav-receive',
            labelKey: 'TR_NAV_RECEIVE',
            category: CommandCategory.Navigation,
            icon: 'arrowDown',
            keywords: ['receive', 'address', 'deposit'],
            isAvailable: !!accountParams,
            execute: () => {
                if (accountParams) {
                    dispatch(goto({ routeName: 'wallet-receive', params: accountParams }));
                }
            },
        },
        {
            id: 'nav-earn',
            labelKey: 'TR_EARN',
            category: CommandCategory.Navigation,
            icon: 'piggyBank',
            keywords: ['earn', 'staking', 'yield', 'interest'],
            execute: () => dispatch(goto({ routeName: 'suite-earn' })),
        },
        {
            id: 'nav-buy',
            labelKey: 'TR_NAV_BUY',
            category: CommandCategory.Navigation,
            icon: 'currencyCircleDollar',
            keywords: ['buy', 'purchase', 'fiat'],
            execute: () => dispatch(goto({ routeName: 'wallet-trading-buy' })),
        },
        {
            id: 'nav-sell',
            labelKey: 'TR_NAV_SELL',
            category: CommandCategory.Navigation,
            icon: 'currencyCircleDollar',
            keywords: ['sell', 'cash out'],
            execute: () => dispatch(goto({ routeName: 'wallet-trading-sell' })),
        },
        {
            id: 'nav-exchange',
            labelKey: 'TR_NAV_TRADE',
            category: CommandCategory.Navigation,
            icon: 'arrowsCounterClockwise',
            keywords: ['exchange', 'swap', 'convert', 'trade'],
            execute: () => dispatch(goto({ routeName: 'wallet-trading-exchange' })),
        },
        {
            id: 'nav-switch-device',
            labelKey: 'TR_COMMAND_PALETTE_SWITCH_DEVICE',
            category: CommandCategory.Navigation,
            icon: 'eject',
            keywords: ['switch', 'device', 'wallet', 'trezor'],
            shortcutHint: 'ALT+D',
            execute: () =>
                dispatch(goto({ routeName: 'suite-switch-device', params: { cancelable: true } })),
        },
        {
            id: 'nav-notifications',
            labelKey: 'TR_NOTIFICATIONS',
            category: CommandCategory.Navigation,
            icon: 'bell',
            keywords: ['notifications', 'alerts', 'activity'],
            execute: () => dispatch(goto({ routeName: 'notifications-index' })),
        },
    ];
};
