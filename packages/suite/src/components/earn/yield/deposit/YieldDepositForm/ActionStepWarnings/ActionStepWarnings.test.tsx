import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mock } from '@suite-common/dependency-injection';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { ActionStepWarnings } from './ActionStepWarnings';
import {
    type ActionStepWarningsContextValue,
    useActionStepWarningsContextValue,
} from './ActionStepWarningsContext/hooks/useActionStepWarningsContextValue';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

jest.mock('./ActionStepWarningsContext/hooks/useActionStepWarningsContextValue');

const WARNING_TEST_IDS = [
    '@yield/warning/insufficient-fee-reserve',
    '@yield/warning/approval-too-low',
    '@yield/warning/insufficient-funds',
    '@yield/warning/fee-reserve-top-up',
];

const MINIMUM_RESERVE = '0.002';
const RECOMMENDED_RESERVE = '0.01';

const createContextValue = (
    overrides: Partial<ActionStepWarningsContextValue>,
): ActionStepWarningsContextValue => ({
    networkSymbol: asNetworkSymbol('eth'),
    amountIssues: [],
    gasReserve: { minimum: MINIMUM_RESERVE, recommended: RECOMMENDED_RESERVE },
    nativeFeeStatus: 'sufficient',
    isApprovalInsufficient: false,
    hasPendingTransaction: false,
    onModifyApproval: mock<() => void>(),
    ...overrides,
});

const renderWarnings = (overrides: Partial<ActionStepWarningsContextValue> = {}) => {
    jest.mocked(useActionStepWarningsContextValue).mockReturnValue(createContextValue(overrides));

    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(services, <ActionStepWarnings />);
};

const getVisibleWarnings = () =>
    WARNING_TEST_IDS.filter(testId => screen.queryByTestId(testId) !== null);

describe('ActionStepWarnings', () => {
    it('blocks with the minimum reserve while the balance is below it', () => {
        renderWarnings({
            nativeFeeStatus: 'insufficient',
            isApprovalInsufficient: true,
            amountIssues: ['amount-too-high'],
        });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-fee-reserve']);

        const warning = screen.getByTestId('@yield/warning/insufficient-fee-reserve');

        expect(warning).toHaveTextContent(MINIMUM_RESERVE);
        expect(warning).not.toHaveTextContent(RECOMMENDED_RESERVE);
    });

    it('shows no warning while the deposit is pending', () => {
        renderWarnings({ hasPendingTransaction: true, nativeFeeStatus: 'insufficient' });

        expect(getVisibleWarnings()).toEqual([]);
    });

    it('shows no warning for an amount with invalid decimals', () => {
        renderWarnings({
            nativeFeeStatus: 'insufficient',
            amountIssues: ['amount-invalid-decimals'],
        });

        expect(getVisibleWarnings()).toEqual([]);
    });

    it('asks to modify an approval that does not cover the amount', async () => {
        const onModifyApproval = mock<() => void>();
        renderWarnings({
            isApprovalInsufficient: true,
            nativeFeeStatus: 'below-recommended',
            amountIssues: ['amount-too-high'],
            onModifyApproval,
        });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/approval-too-low']);

        await userEvent.click(screen.getByTestId('@yield/warning/modify-approval-button'));

        expect(onModifyApproval).toHaveBeenCalledTimes(1);
    });

    it('warns about an amount above the balance before recommending a top-up', () => {
        renderWarnings({ nativeFeeStatus: 'below-recommended', amountIssues: ['amount-too-high'] });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/insufficient-funds']);
    });

    it('recommends topping up to the recommended reserve', () => {
        renderWarnings({ nativeFeeStatus: 'below-recommended' });

        expect(getVisibleWarnings()).toEqual(['@yield/warning/fee-reserve-top-up']);
        expect(screen.getByTestId('@yield/warning/fee-reserve-top-up')).toHaveTextContent(
            RECOMMENDED_RESERVE,
        );
    });

    it('shows no warning while the balance covers the recommended reserve', () => {
        renderWarnings();

        expect(getVisibleWarnings()).toEqual([]);
    });
});
