import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { WrapStepWarnings } from './WrapStepWarnings';
import {
    type WrapStepWarningsContextValue,
    useWrapStepWarningsContextValue,
} from './WrapStepWarningsContext/hooks/useWrapStepWarningsContextValue';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

jest.mock('./WrapStepWarningsContext/hooks/useWrapStepWarningsContextValue');

const WARNING_TEST_IDS = [
    '@yield/warning/insufficient-fee-reserve',
    '@yield/warning/insufficient-funds',
    '@yield/warning/reserve-kept',
    '@yield/warning/reserve-recommendation',
];

const RESERVE = '0.005';

const createContextValue = (
    overrides: Partial<WrapStepWarningsContextValue>,
): WrapStepWarningsContextValue => ({
    networkSymbol: asNetworkSymbol('eth'),
    nativeBalance: '1',
    amount: '0.5',
    amountIssues: [],
    reserve: RESERVE,
    nativeFeeStatus: 'sufficient',
    hasPendingTransaction: false,
    ...overrides,
});

const renderWarnings = (overrides: Partial<WrapStepWarningsContextValue> = {}) => {
    jest.mocked(useWrapStepWarningsContextValue).mockReturnValue(createContextValue(overrides));

    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(services, <WrapStepWarnings />);
};

const getVisibleWarnings = () =>
    WARNING_TEST_IDS.filter(testId => screen.queryByTestId(testId) !== null);

describe('WrapStepWarnings', () => {
    it('blocks with the recommended reserve while the balance does not exceed it', () => {
        renderWarnings({
            nativeFeeStatus: 'insufficient',
            amount: '2',
            amountIssues: ['amount-too-high'],
        });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-fee-reserve']);
        expect(screen.getByTestId('@yield/warning/insufficient-fee-reserve')).toHaveTextContent(
            RESERVE,
        );
    });

    it('still blocks on the fee reserve for an amount with invalid decimals', () => {
        renderWarnings({
            nativeFeeStatus: 'insufficient',
            amountIssues: ['amount-invalid-decimals'],
        });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-fee-reserve']);
    });

    it('shows no warning while the wrap is pending', () => {
        renderWarnings({
            hasPendingTransaction: true,
            nativeFeeStatus: 'insufficient',
            amount: '2',
            amountIssues: ['amount-too-high'],
        });

        expect(getVisibleWarnings()).toEqual([]);
    });

    it('warns about an amount above the balance', () => {
        renderWarnings({ amount: '2', amountIssues: ['amount-too-high'] });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-funds']);
    });

    it('confirms the reserve kept by the Max amount', () => {
        renderWarnings({ amount: '0.995' });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/reserve-kept']);
        expect(screen.getByTestId('@yield/warning/reserve-kept')).toHaveTextContent(RESERVE);
    });

    it('recommends keeping the reserve when the amount eats into it', () => {
        renderWarnings({ amount: '0.999' });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/reserve-recommendation']);
        expect(screen.getByTestId('@yield/warning/reserve-recommendation')).toHaveTextContent(
            RESERVE,
        );
    });

    it('skips the amount warnings for an amount with invalid decimals', () => {
        renderWarnings({ amount: '0.999', amountIssues: ['amount-invalid-decimals'] });

        expect(getVisibleWarnings()).toEqual([]);
    });

    it('shows no warning when more than the reserve is left', () => {
        renderWarnings({ amount: '0.5' });

        expect(getVisibleWarnings()).toEqual([]);
    });
});
