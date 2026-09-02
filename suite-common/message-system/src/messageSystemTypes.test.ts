import { type TradingType } from '@suite-common/suite-types';
import {
    type AccountType,
    type NetworkSymbol,
    type StakingNetworkSymbol,
    asNetworkSymbol,
} from '@suite-common/wallet-config';

import { Context, type GeneralContextKey, type SettingsCategory } from './messageSystemTypes';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

type StakingContextCase = readonly [StakingNetworkSymbol, string];

const stakingContextCases: readonly StakingContextCase[] = [
    ['eth', 'accounts.eth.staking'],
    ['sol', 'accounts.sol.staking'],
    ['trx', 'accounts.trx.staking'],
];

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
                [btcSymbol, undefined, 'accounts.btc'],
                [btcSymbol, 'legacy', 'accounts.btc.legacy'],
                [ethSymbol, undefined, 'accounts.eth'],
                [ethSymbol, 'ledger', 'accounts.eth.ledger'],
                [asNetworkSymbol('base'), undefined, 'accounts.base'],
            ] as const satisfies [NetworkSymbol, AccountType | undefined, string][])(
                'getAccount(%s, %s) → %s',
                (symbol, type, expected) => {
                    expect(Context.getAccount(symbol, type)).toBe(expected);
                },
            );
        });

        describe('getStaking', () => {
            it.each(stakingContextCases)('getStaking(%s) → %s', (symbol, expected) => {
                expect(Context.getStaking(symbol)).toBe(expected);
            });
        });

        describe('getTrading', () => {
            it.each([
                ['buy', 'trading.buy'],
                ['sell', 'trading.sell'],
                ['exchange', 'trading.exchange'],
                ['concierge', 'trading.concierge'],
            ] as const satisfies [TradingType, string][])(
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
                ['deposit', 'earn.yield.deposit'],
                ['withdraw', 'earn.yield.withdraw'],
                ['redeem', 'earn.yield.redeem'],
                ['claim', 'earn.yield.claim'],
            ] as const)('getEarnYield(%s) → %s', (type, expected) => {
                expect(Context.getEarnYield(type)).toBe(expected);
            });
        });

        describe('getWrappedNative', () => {
            it.each([
                ['wrap', 'earn.wrappedNative.wrap'],
                ['unwrap', 'earn.wrappedNative.unwrap'],
            ] as const)('getWrappedNative(%s) → %s', (type, expected) => {
                expect(Context.getWrappedNative(type)).toBe(expected);
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
