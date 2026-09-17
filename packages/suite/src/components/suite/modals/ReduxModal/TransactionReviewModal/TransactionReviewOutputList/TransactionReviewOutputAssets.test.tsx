import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormStateTradingCryptoCurrency } from '@suite-common/wallet-types';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import {
    TransactionReviewOutputAssets,
    type TransactionReviewOutputAssetsProps,
} from './TransactionReviewOutputAssets';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const send: FormStateTradingCryptoCurrency = {
    cryptoId: 'bitcoin' as CryptoId,
    accountKey: undefined,
    symbol: asNetworkSymbol('btc'),
    amount: '0.025',
};

const cryptoReceive: FormStateTradingCryptoCurrency = {
    cryptoId: 'ethereum' as CryptoId,
    accountKey: undefined,
    symbol: asNetworkSymbol('eth'),
    amount: '0.5',
};

const renderAssets = (receive: TransactionReviewOutputAssetsProps['receive']) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        root,
        <TransactionReviewOutputAssets
            title="My assets"
            state="active"
            send={send}
            receive={receive}
        />,
    );
};

describe('TransactionReviewOutputAssets', () => {
    it('formats the fiat receive leg with the trading fiat formatter', () => {
        renderAssets({ amount: '1000', fiatCurrency: 'USD' });

        expect(screen.getByTestId('@modal/assets/send/crypto')).toHaveTextContent('0.025 BTC');
        expect(screen.getByTestId('@modal/assets/receive/label')).toHaveTextContent(
            /^\+\s*1,000\.00 USD$/,
        );
        expect(screen.queryByTestId('@modal/assets/receive/crypto')).not.toBeInTheDocument();
    });

    it('renders a crypto receive leg without the fiat label', () => {
        renderAssets(cryptoReceive);

        expect(screen.getByTestId('@modal/assets/receive/crypto')).toHaveTextContent('0.5 ETH');
        expect(screen.queryByTestId('@modal/assets/receive/label')).not.toBeInTheDocument();
    });
});
