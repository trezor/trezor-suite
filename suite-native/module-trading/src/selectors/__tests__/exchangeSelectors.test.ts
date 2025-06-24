import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';
import { TradingRootState as CommonTradingRootState } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';

import { getBtcAccount } from '../../__fixtures__/account';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingRootState, TradingState, tradingSlice } from '../../tradingSlice';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeTradeableAssetsSorted,
    selectTradingExchange,
} from '../exchangeSelectors';

describe('exchangeSelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let prevState: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
        prevState = getInitializedTradingState('exchange');
    });

    it('selectTradingExchange should select trading exchange state', () => {
        expect(selectTradingExchange({ wallet: { tradingNew: prevState } })).toEqual(
            prevState.exchange,
        );
    });

    describe('selectExchangeSelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            prevState.exchange.receiveAccountKey = account.key;
            prevState.exchange.receiveAddress = account.addresses?.used[0];
        });

        it('should be undefined when no receiveAccountKey is defined', () => {
            prevState.exchange.receiveAccountKey = undefined;
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;

            expect(selectExchangeSelectedReceiveAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;
            expect(selectExchangeSelectedReceiveAccount(state)).toEqual({
                account,
                address: account.addresses?.used[0],
            });
        });

        it('should be stable', () => {
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;
            expect(selectExchangeSelectedReceiveAccount(state)).toBe(
                selectExchangeSelectedReceiveAccount(state),
            );
        });

        it('should throw when no account with given key exists', () => {
            prevState.exchange.receiveAccountKey = 'unknown_account_key';
            const state = {
                wallet: { tradingNew: prevState, accounts: [account] },
            } as unknown as CommonTradingRootState & TradingRootState;

            expect(() => selectExchangeSelectedReceiveAccount(state)).toThrow(
                'Unknown receiveAccountKey: [unknown_account_key]',
            );
        });
    });

    describe('selectExchangeTradeableAssetsSorted', () => {
        it('should select only coins with exchange set to true', () => {
            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            prevState.exchange.exchangeInfo!.buyCryptoIds = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should be stable', () => {
            const first = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });
            const second = selectExchangeTradeableAssetsSorted({
                wallet: { tradingNew: prevState },
            });

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            prevState = tradingReducer(undefined, { type: 'undefined_action' });

            expect(
                selectExchangeTradeableAssetsSorted({ wallet: { tradingNew: prevState } }),
            ).toEqual([]);
        });
    });
});
