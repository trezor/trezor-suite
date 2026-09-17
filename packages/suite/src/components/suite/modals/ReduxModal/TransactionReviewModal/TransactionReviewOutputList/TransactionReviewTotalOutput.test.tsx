import '@suite-common/test-utils/globalOverrides';

import { screen, within } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type FormStateTrading,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const device = mockSuiteDevice(undefined, {
    major_version: 2,
    minor_version: 12,
    patch_version: 4,
});

const precomposedTx = {
    outputs: [{ address: 'address', amount: '100000' }],
    fee: '1000',
    totalSpent: '101000',
    feePerByte: '1',
    useNativeRbf: false,
} as unknown as GeneralPrecomposedTransactionFinal;

const buildSellTrading = (symbol: NetworkSymbol): FormStateTrading => ({
    activeSection: 'sell',
    isSlip24Active: true,
    recipientName: 'Banxa',
    send: {
        cryptoId: undefined,
        accountKey: undefined,
        symbol,
        amount: '0.001',
    },
    receive: {
        amount: '1000',
        fiatCurrency: 'USD',
    },
});

const buildFormState = (trading?: FormStateTrading): FormState => ({
    outputs: [],
    feePerUnit: '1',
    feeLimit: '21000',
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    trading,
});

const renderTotalOutput = (symbol: NetworkSymbol, trading?: FormStateTrading) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            ...mockInitialAppState,
            device: { ...mockInitialAppState.device, selectedDevice: device },
        },
    });

    renderWithProviders(
        root,
        <TransactionReviewTotalOutput
            account={mockWalletAccount({ symbol })}
            state="active"
            precomposedTx={precomposedTx}
            precomposedForm={buildFormState(trading)}
            isRbf={false}
        />,
    );
};

const feeHeadline = () =>
    within(screen.getByTestId('@modal/output-fee')).getByTestId('@modal/output-headline');

describe('TransactionReviewTotalOutput', () => {
    it('labels the SLIP-24 fee-only row as a fee on bitcoin', () => {
        renderTotalOutput(asNetworkSymbol('btc'), buildSellTrading(asNetworkSymbol('btc')));

        expect(feeHeadline()).toHaveTextContent(/^Fee$/);
        expect(screen.queryByTestId('@modal/output-total')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@modal/output-amount')).not.toBeInTheDocument();
    });

    it('labels the SLIP-24 fee-only row as a maximum fee on ethereum', () => {
        renderTotalOutput(asNetworkSymbol('eth'), buildSellTrading(asNetworkSymbol('eth')));

        expect(feeHeadline()).toHaveTextContent(/^Maximum fee$/);
        expect(screen.queryByTestId('@modal/output-amount')).not.toBeInTheDocument();
    });

    it('keeps the total row for a regular transaction', () => {
        renderTotalOutput(asNetworkSymbol('btc'));

        expect(screen.getByTestId('@modal/output-total')).toBeInTheDocument();
        expect(feeHeadline()).toHaveTextContent(/^Including fee$/);
    });
});
