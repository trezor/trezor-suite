import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { ApproveStepWarnings } from './ApproveStepWarnings';
import {
    type ApproveStepWarningsContextValue,
    useApproveStepWarningsContextValue,
} from './ApproveStepWarningsContext/hooks/useApproveStepWarningsContextValue';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

jest.mock('./ApproveStepWarningsContext/hooks/useApproveStepWarningsContextValue');

const WARNING_TEST_IDS = [
    '@yield/warning/insufficient-fee-reserve',
    '@yield/warning/approve-over-balance',
    '@yield/warning/fee-reserve-top-up',
];

const MINIMUM_RESERVE = '0.002';
const RECOMMENDED_RESERVE = '0.01';

const createContextValue = (
    overrides: Partial<ApproveStepWarningsContextValue>,
): ApproveStepWarningsContextValue => ({
    networkSymbol: asNetworkSymbol('eth'),
    amountIssues: [],
    gasReserve: { minimum: MINIMUM_RESERVE, recommended: RECOMMENDED_RESERVE },
    nativeFeeStatus: 'sufficient',
    hasPendingTransaction: false,
    ...overrides,
});

const renderWarnings = (overrides: Partial<ApproveStepWarningsContextValue> = {}) => {
    jest.mocked(useApproveStepWarningsContextValue).mockReturnValue(createContextValue(overrides));

    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(services, <ApproveStepWarnings />);
};

const getVisibleWarnings = () =>
    WARNING_TEST_IDS.filter(testId => screen.queryByTestId(testId) !== null);

describe('ApproveStepWarnings', () => {
    it('blocks with the minimum reserve while the balance is below it', () => {
        renderWarnings({ nativeFeeStatus: 'insufficient', amountIssues: ['amount-too-high'] });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-fee-reserve']);

        const warning = screen.getByTestId('@yield/warning/insufficient-fee-reserve');

        expect(warning).toHaveTextContent(MINIMUM_RESERVE);
        expect(warning).not.toHaveTextContent(RECOMMENDED_RESERVE);
    });

    it('shows no warning while the approval is pending', () => {
        renderWarnings({
            hasPendingTransaction: true,
            nativeFeeStatus: 'insufficient',
            amountIssues: ['amount-too-high'],
        });

        expect(getVisibleWarnings()).toEqual([]);
    });

    it('notes an approval above the balance before recommending a top-up', () => {
        renderWarnings({ nativeFeeStatus: 'below-recommended', amountIssues: ['amount-too-high'] });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/approve-over-balance']);
    });

    it('recommends topping up to the recommended reserve', () => {
        renderWarnings({ nativeFeeStatus: 'below-recommended' });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/fee-reserve-top-up']);
        expect(screen.getByTestId('@yield/warning/fee-reserve-top-up')).toHaveTextContent(
            RECOMMENDED_RESERVE,
        );
    });

    it('skips the over-balance note for an amount with invalid decimals', () => {
        renderWarnings({
            nativeFeeStatus: 'below-recommended',
            amountIssues: ['amount-too-high', 'amount-invalid-decimals'],
        });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/fee-reserve-top-up']);
    });

    it('shows no warning while the balance covers the recommended reserve', () => {
        renderWarnings();

        expect(getVisibleWarnings()).toEqual([]);
    });
});
