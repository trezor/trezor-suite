import {
    type AccountType,
    type NetworkSymbol,
    type StakingNetworkSymbol,
} from '@suite-common/wallet-config';

import { Context, type GeneralContextKey, type SettingsCategory } from '../messageSystemTypes';

describe('Message system types', () => {
    describe('Context', () => {
        describe('getGeneral', () => {
            it.each([['dashboard', 'dashboard']] as const satisfies [GeneralContextKey, string][])(
                'getGeneral(%s) → %s',
                (input, expected) => {
                    expect(Context.getGeneral(input)).toBe(expected);
                },
            );
        });

        describe('getAccount', () => {
            it.each([
                ['btc', undefined, 'accounts.btc'],
                ['btc', 'legacy', 'accounts.btc.legacy'],
                ['eth', undefined, 'accounts.eth'],
                ['eth', 'ledger', 'accounts.eth.ledger'],
                ['base', undefined, 'accounts.base'],
            ] as const satisfies [NetworkSymbol, AccountType | undefined, string][])(
                'getAccount(%s, %s) → %s',
                (symbol, type, expected) => {
                    expect(Context.getAccount(symbol, type)).toBe(expected);
                },
            );
        });

        describe('getStaking', () => {
            it.each([
                ['eth', 'accounts.eth.staking'],
                ['sol', 'accounts.sol.staking'],
            ] as const satisfies [StakingNetworkSymbol, string][])(
                'getStaking(%s) → %s',
                (symbol, expected) => {
                    expect(Context.getStaking(symbol)).toBe(expected);
                },
            );
        });

        describe('getTrading', () => {
            it.each([
                ['buy', 'trading.buy'],
                ['sell', 'trading.sell'],
                ['exchange', 'trading.exchange'],
                // Todo: fix TradingType see: https://github.com/trezor/trezor-suite/pull/21265
            ] as const satisfies ['buy' | 'sell' | 'exchange', string][])(
                'getTrading(%s) → %s',
                (type, expected) => {
                    expect(Context.getTrading(type)).toBe(expected);
                },
            );
        });

        describe('getEarnDashboard', () => {
            it.each([
                ['staking', 'earn.dashboard.staking'],
                ['yield', 'earn.dashboard.yield'],
            ] as const)('getEarnDashboard(%s) → %s', (type, expected) => {
                expect(Context.getEarnDashboard(type)).toBe(expected);
            });
        });

        describe('getEarnYield', () => {
            it.each([
                ['supply', 'earn.yield.supply'],
                ['withdraw', 'earn.yield.withdraw'],
            ] as const)('getEarnYield(%s) → %s', (type, expected) => {
                expect(Context.getEarnYield(type)).toBe(expected);
            });
        });

        describe('getSettings', () => {
            it.each([
                ['general', 'settings.general'],
                ['device', 'settings.device'],
                ['networks', 'settings.networks'],
                ['debug', 'settings.debug'],
            ] as const satisfies [SettingsCategory, string][])(
                'getSettings(%s) → %s',
                (category, expected) => {
                    expect(Context.getSettings(category)).toBe(expected);
                },
            );
        });
    });
});
