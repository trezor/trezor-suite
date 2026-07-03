import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type ReviewSummaryOutput } from '@suite-native/transaction-management';

import { UnstakeTransactionDataReviewStepList } from '../UnstakeTransactionDataReviewStepList';

const mockUnstakeOutputItem = jest.fn();
const mockEarnSummaryOutputItem = jest.fn();

let mockIsTransactionAlreadySigned: boolean;
let mockSummaryOutput: ReviewSummaryOutput | null;
let mockAccountNetworkSymbol: string | null;
let mockPrecomposed: { fee: string; solanaTxMeta?: { deviceAmountLamports: string } };

const accountKey = mockAccountKey({ symbol: 'eth', descriptor: 'ethAccount' });

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: { accountKey, amount: '1' } }),
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

jest.mock('../UnstakeOutputItem', () => ({
    UnstakeOutputItem: (props: { outputState?: string }) => {
        mockUnstakeOutputItem(props);

        return null;
    },
}));

jest.mock('../EarnSummaryOutputItem', () => ({
    EarnSummaryOutputItem: (props: { outputState?: string; fee?: string }) => {
        mockEarnSummaryOutputItem(props);

        return null;
    },
}));

jest.mock('../../hooks/useEarnSelectedPrecomposedTransaction', () => ({
    useEarnSelectedPrecomposedTransaction: () => mockPrecomposed,
}));

const renderStepList = () => renderWithStoreProvider(<UnstakeTransactionDataReviewStepList />);

describe('UnstakeTransactionDataReviewStepList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsTransactionAlreadySigned = false;
        mockSummaryOutput = null;
        mockAccountNetworkSymbol = 'eth';
        mockPrecomposed = { fee: '21000' };
    });

    it('renders nothing until the account network symbol is known', () => {
        mockAccountNetworkSymbol = null;

        renderStepList();

        expect(mockUnstakeOutputItem).not.toHaveBeenCalled();
        expect(mockEarnSummaryOutputItem).not.toHaveBeenCalled();
    });

    it('renders the unstake and summary cards without a Next button', () => {
        const { queryByText, queryByTestId } = renderStepList();

        expect(mockUnstakeOutputItem).toHaveBeenCalledTimes(1);
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledTimes(1);
        expect(queryByText(getTranslation('generic.buttons.next'))).toBeNull();
        expect(queryByTestId('@earn/unstake-review-continue')).toBeNull();
    });

    it('keeps the unstake step active and the summary hidden until the device confirms the outputs', () => {
        mockSummaryOutput = null;

        renderStepList();

        expect(mockUnstakeOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: 'active' }),
        );
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ outputState: undefined }),
        );
    });

    it('marks the unstake step done and activates the summary once all device outputs are confirmed', () => {
        mockSummaryOutput = { state: 'active', totalSpent: '1', fee: '21000' };

        renderStepList();

        expect(mockUnstakeOutputItem).toHaveBeenCalledWith(
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

        expect(mockUnstakeOutputItem).toHaveBeenCalledWith(
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

    it('converts the entered amount to base units when there is no Solana tx meta (e.g. Ethereum)', () => {
        renderStepList();

        // Route amount '1' ETH -> 1e18 wei.
        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ amount: '1000000000000000000' }),
        );
    });

    it('shows the Solana device amount, not the entered one, when the split logic adjusts the amount', () => {
        // User typed 1 SOL but the min-delegation split logic deactivates a whole 2 SOL account.
        mockAccountNetworkSymbol = 'sol';
        mockPrecomposed = { fee: '5000', solanaTxMeta: { deviceAmountLamports: '2000000000' } };

        renderStepList();

        expect(mockEarnSummaryOutputItem).toHaveBeenCalledWith(
            expect.objectContaining({ amount: '2000000000' }),
        );
    });
});
