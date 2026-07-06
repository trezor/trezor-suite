import { type Network, networks } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type Account } from 'src/types/wallet';
import { FIXTURE_ACCOUNT_OPTIONS } from 'src/utils/wallet/trading/__fixtures__/tradingUtils';
import {
    getComposeAddressPlaceholder,
    resolveAddressAndToken,
    tradingGetAccountLabel,
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
} from 'src/utils/wallet/trading/tradingUtils';

describe('trading utils', () => {
    it('tradingGetAmountLabels', () => {
        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_SWAP_AMOUNT',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });
    });

    it('tradingGetRoundedFiatAmount', () => {
        expect(tradingGetRoundedFiatAmount('0.23923')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.24423')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.2')).toBe('0.20');
        expect(tradingGetRoundedFiatAmount(undefined)).toBe('');
        expect(tradingGetRoundedFiatAmount('293SAsdj2')).toBe(''); // NaN
    });

    it('tradingGetAccountLabel', () => {
        expect(tradingGetAccountLabel('BTC', true)).toBe('sat');
        expect(tradingGetAccountLabel('BTC', false)).toBe('BTC');
        expect(tradingGetAccountLabel('USDT', true)).toBe('USDT');
        expect(tradingGetAccountLabel('USDT', false)).toBe('USDT');
    });

    it('resolveAddressAndToken - testing correct returning value fot setting FormState to send currency', () => {
        FIXTURE_ACCOUNT_OPTIONS.forEach(({ option, result }) => {
            expect(resolveAddressAndToken(option.account, option.tokenContractAddress)).toEqual(
                result,
            );
        });
    });

    describe('getComposeAddressPlaceholder', () => {
        describe('bitcoin', () => {
            it('returns change address as fallback when no device is provided', async () => {
                const account = {
                    networkType: 'bitcoin',
                    symbol: 'btc',
                    addresses: {
                        change: [{ address: 'bc1qChangeAddress' }],
                    },
                } as unknown as Account;

                const network = networks.btc;

                const result = await getComposeAddressPlaceholder(account, network);

                expect(result).toBe('bc1qChangeAddress');
            });
        });

        describe('ethereum', () => {
            it('returns empty string', async () => {
                const ethereumAccount = {
                    networkType: 'ethereum',
                    descriptor: asAccountDescriptor('0xEthAddress'),
                } as unknown as Account;

                const result = await getComposeAddressPlaceholder(ethereumAccount, {} as Network);

                expect(result).toBe('');
            });
        });

        describe('cardano', () => {
            it('returns empty string', async () => {
                const cardanoAccount = {
                    networkType: 'cardano',
                    descriptor: asAccountDescriptor('addr1CardanoAddress'),
                } as unknown as Account;

                const result = await getComposeAddressPlaceholder(cardanoAccount, {} as Network);

                expect(result).toBe('');
            });
        });

        describe.each([
            { networkType: 'solana', descriptor: 'SolanaAddress123' },
            { networkType: 'ripple', descriptor: 'rRippleAddress123' },
            { networkType: 'stellar', descriptor: 'GStellarAddress123' },
        ] as const)('$networkType', ({ networkType, descriptor }) => {
            it('returns account descriptor', async () => {
                const account = {
                    networkType,
                    descriptor: asAccountDescriptor(descriptor),
                } as unknown as Account;

                const result = await getComposeAddressPlaceholder(account, {} as Network);

                expect(result).toBe(descriptor);
            });
        });

        it('returns empty string for tron (fee uses compose context recipient)', async () => {
            const account = mockWalletAccount({
                symbol: 'trx',
                descriptor: asAccountDescriptor('TTronAddress123'),
            });

            const result = await getComposeAddressPlaceholder(account, {} as Network);

            expect(result).toBe('');
        });
    });
});
