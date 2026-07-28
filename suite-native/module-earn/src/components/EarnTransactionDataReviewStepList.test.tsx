import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type ReviewSummaryOutput } from '@suite-native/transaction-management';

import { EarnTransactionDataReviewStepList } from './EarnTransactionDataReviewStepList';

const mockEarnStakeOutputItem = jest.fn();
const mockEarnSummaryOutputItem = jest.fn();

let mockIsTransactionAlreadySigned: boolean;
let mockSummaryOutput: ReviewSummaryOutput | null;

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectIsTransactionAlreadySigned: () => mockIsTransactionAlreadySigned,
    selectReviewSummaryOutput: () => mockSummaryOutput,
}));

jest.mock('./EarnStakeOutputItem', () => ({
    EarnStakeOutputItem: (props: { outputState?: string }) => {
        mockEarnStakeOutputItem(props);

        return null;
    },
}));

jest.mock('./EarnSummaryOutputItem', () => ({
    EarnSummaryOutputItem: (props: { outputState?: string; fee?: string }) => {
        mockEarnSummaryOutputItem(props);

        return null;
    },
}));

jest.mock('../hooks/useEarnSelectedPrecomposedTransaction', () => ({
    useEarnSelectedPrecomposedTransaction: () => ({ fee: '21000' }),
}));

const accountKey = mockAccountKey({ symbol: 'eth', descriptor: 'ethAccount' });

const renderStepList = () =>
    renderWithStoreProvider(
        <EarnTransactionDataReviewStepList
            accountKey={accountKey}
            amount="1"
            accountSymbol="eth"
        />,
    );

describe('EarnTransactionDataReviewStepList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsTransactionAlreadySigned = false;
        mockSummaryOutput = null;
    });

    it('renders the stake and summary cards without a Next button', () => {
        const { queryByText, queryByTestId } = renderStepList();

        expect(mockEarnStakeOutputItem).toHaveBeenCalledTimes(1);
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledTimes(1);
        expect(queryByText(getTranslation('generic.buttons.next'))).toBeNull();
        expect(queryByTestId('@earn/address-review-continue')).toBeNull();
    });

    it('keeps the stake step active and the summary hidden until the device confirms the outputs', () => {
        mockSummaryOutput = null;

        renderStepList();

        expect(mockEarnStakeOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'active' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: undefined }),
        );
    });

    it('marks the stake step done and activates the summary once all device outputs are confirmed', () => {
        mockSummaryOutput = { state: 'active', totalSpent: '1', fee: '21000' };

        renderStepList();

        expect(mockEarnStakeOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'success' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'active' }),
        );
    });

    it('marks both steps done and hides the sliding footer once the transaction is signed', () => {
        mockIsTransactionAlreadySigned = true;
        mockSummaryOutput = { state: 'success', totalSpent: '1', fee: '21000' };

        const { queryByTestId } = renderStepList();

        expect(mockEarnStakeOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'success' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'success' }),
        );
        expect(queryByTestId('sliding-footer-overlay')).toBeNull();
    });

    it('shows the sliding footer while the transaction is not signed', () => {
        const { getByTestId } = renderStepList();

        expect(getByTestId('sliding-footer-overlay')).toBeOnTheScreen();
    });
});
