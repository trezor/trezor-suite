import { type BtcSwapComposeTemplate } from 'invity-api';

import { deriveBitcoinSwapFromAddresses } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { waitFor } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    eth1NormalAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';

import { useBitcoinExchangeMaxSpendableAmount } from './useBitcoinExchangeMaxSpendableAmount';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    deriveBitcoinSwapFromAddresses: jest.fn(),
}));

const mockDeriveBitcoinSwapFromAddresses = jest.mocked(deriveBitcoinSwapFromAddresses);

const BTC_SWAP_COMPOSE_TEMPLATE: BtcSwapComposeTemplate = {
    extraOutputs: [{ type: 'opreturn', dataHex: 'aa' }],
};

describe(useBitcoinExchangeMaxSpendableAmount.name, () => {
    const renderUseBitcoinExchangeMaxSpendableAmount = async (
        maxSpendableAmount: string | undefined,
        tradingAccountKey: AccountKey,
    ) => {
        const tradingState = getInitializedTradingState('exchange');

        return await renderHookWithTradingProvider(
            () => useBitcoinExchangeMaxSpendableAmount(maxSpendableAmount),
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        accounts: [btc1NormalAccount, eth1NormalAccount],
                        trading: {
                            ...tradingState,
                            exchange: { ...tradingState.exchange, tradingAccountKey },
                            info: {
                                ...tradingState.info,
                                config: { btcSwapComposeTemplate: BTC_SWAP_COMPOSE_TEMPLATE },
                            },
                        },
                    },
                },
            },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should lower the max amount to the bitcoin swap max', async () => {
        mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
            addresses: ['input-address'],
            amount: '800000',
        });

        const { result } = await renderUseBitcoinExchangeMaxSpendableAmount(
            '0.009',
            btc1NormalAccount.key,
        );

        await waitFor(() => expect(result.current).toBe('0.008'));
        expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledWith(
            expect.objectContaining({
                account: btc1NormalAccount,
                setMaxOutputId: 0,
                btcSwapComposeTemplate: BTC_SWAP_COMPOSE_TEMPLATE,
            }),
        );
    });

    it('should keep the max amount when it is lower than the bitcoin swap max', async () => {
        mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
            addresses: ['input-address'],
            amount: '950000',
        });

        const { result } = await renderUseBitcoinExchangeMaxSpendableAmount(
            '0.009',
            btc1NormalAccount.key,
        );

        await waitFor(() => expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalled());
        expect(result.current).toBe('0.009');
    });

    it('should keep the max amount when the bitcoin swap max cannot be derived', async () => {
        mockDeriveBitcoinSwapFromAddresses.mockResolvedValue(undefined);

        const { result } = await renderUseBitcoinExchangeMaxSpendableAmount(
            '0.009',
            btc1NormalAccount.key,
        );

        await waitFor(() => expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalled());
        expect(result.current).toBe('0.009');
    });

    it('should keep the max amount of a non-bitcoin account', async () => {
        const { result } = await renderUseBitcoinExchangeMaxSpendableAmount(
            '1.5',
            eth1NormalAccount.key,
        );

        expect(result.current).toBe('1.5');
        expect(mockDeriveBitcoinSwapFromAddresses).not.toHaveBeenCalled();
    });
});
