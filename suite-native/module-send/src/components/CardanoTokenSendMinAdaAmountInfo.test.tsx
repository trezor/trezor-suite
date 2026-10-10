import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransaction, type TokenAddress } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { CardanoTokenSendMinAdaAmountInfo } from './CardanoTokenSendMinAdaAmountInfo';

const tokenContract = 'policyIdAssetName' as TokenAddress;
const composedFeeLevel: GeneralPrecomposedTransaction = {
    type: 'nonfinal',
    fee: '170000',
    feePerByte: '44',
    bytes: 0,
    totalSpent: '1340000',
    max: undefined,
};

type RenderParams = {
    balance?: string;
    feeLevels?: Record<string, GeneralPrecomposedTransaction>;
    isTokenSend?: boolean;
    symbol?: string;
};

const renderMinAdaAmountInfo = async ({
    balance = '1500000',
    feeLevels = {},
    isTokenSend = true,
    symbol = 'ada',
}: RenderParams = {}) => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol(symbol), balance });

    return await renderWithStoreProvider(
        <CardanoTokenSendMinAdaAmountInfo
            accountKey={account.key}
            tokenContract={isTokenSend ? tokenContract : undefined}
        />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    send: { drafts: {}, feeLevels },
                },
            },
        },
    );
};

describe('CardanoTokenSendMinAdaAmountInfo', () => {
    it('renders nothing outside a token send', async () => {
        const { toJSON } = await renderMinAdaAmountInfo({ isTokenSend: false });

        expect(toJSON()).toBeNull();
    });

    it('renders nothing for a token send on another network', async () => {
        const { toJSON } = await renderMinAdaAmountInfo({ symbol: 'eth' });

        expect(toJSON()).toBeNull();
    });

    it('shows a skeleton instead of the estimate while the transaction is composing', async () => {
        const { queryByText } = await renderMinAdaAmountInfo();

        expect(queryByText(/^[\d.]+\sADA$/)).toBeNull();
    });

    it('shows the composed minimum ADA in ADA', async () => {
        const { getByText, queryByText } = await renderMinAdaAmountInfo({
            feeLevels: { normal: composedFeeLevel },
        });

        expect(getByText(/^1\.34\sADA$/)).toBeTruthy();
        expect(queryByText('Not enough ADA for this transaction.')).toBeNull();
    });

    it('shows an error when the ADA balance is below the minimum ADA', async () => {
        const { getByText } = await renderMinAdaAmountInfo({
            balance: '1200000',
            feeLevels: { normal: composedFeeLevel },
        });

        expect(getByText('Not enough ADA for this transaction.')).toBeTruthy();
    });
});
