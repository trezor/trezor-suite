import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type ReviewSummaryOutput } from '@suite-native/transaction-management';

import { ClaimTransactionDataReviewStepList } from './ClaimTransactionDataReviewStepList';

const mockClaimOutputItem = jest.fn();
const mockEarnSummaryOutputItem = jest.fn();

let mockIsTransactionAlreadySigned: boolean;
let mockSummaryOutput: ReviewSummaryOutput | null;
let mockAccountNetworkSymbol: string | null;

const accountKey = mockAccountKey({ symbol: 'eth', descriptor: 'ethAccount' });

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: { accountKey } }),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectIsTransactionAlreadySigned: () => mockIsTransactionAlreadySigned,
    selectReviewSummaryOutput: () => mockSummaryOutput,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountNetworkSymbol: () => mockAccountNetworkSymbol,
}));

jest.mock('@suite-native/staking', () => ({
    ...jest.requireActual('@suite-native/staking'),
    selectClaimableAmountByAccountKey: () => '5',
}));

jest.mock('./ClaimOutputItem', () => ({
    ClaimOutputItem: (props: { outputState?: string }) => {
        mockClaimOutputItem(props);

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
    useEarnSelectedPrecomposedTransaction: () => ({ fee: '21000', totalSpent: '5' }),
}));

const renderStepList = () => renderWithStoreProvider(<ClaimTransactionDataReviewStepList />);

describe('ClaimTransactionDataReviewStepList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsTransactionAlreadySigned = false;
        mockSummaryOutput = null;
        mockAccountNetworkSymbol = 'eth';
    });

    it('renders the claim and summary cards without a Next button', () => {
        const { queryByText, queryByTestId } = renderStepList();

        expect(mockClaimOutputItem).toHaveBeenCalledTimes(1);
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledTimes(1);
        expect(queryByText(getTranslation('generic.buttons.next'))).toBeNull();
        expect(queryByTestId('@earn/claim-review-continue')).toBeNull();
    });

    it('keeps the claim step active and the summary hidden until the device confirms the outputs', () => {
        mockSummaryOutput = null;

        renderStepList();

        expect(mockClaimOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'active' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: undefined }),
        );
    });

    it('marks the claim step done and activates the summary once all device outputs are confirmed', () => {
        mockSummaryOutput = { state: 'active', totalSpent: '5', fee: '21000' };

        renderStepList();

        expect(mockClaimOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'success' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'active' }),
        );
    });

    it('marks both steps done and hides the sliding footer once the transaction is signed', () => {
        mockIsTransactionAlreadySigned = true;
        mockSummaryOutput = { state: 'success', totalSpent: '5', fee: '21000' };

        const { queryByTestId } = renderStepList();

        expect(mockClaimOutputItem).toHaveBeenCalledWith(
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
