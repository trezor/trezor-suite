import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { type EarnFormDraftPrefix } from '../../types';

const mockReviewOutputItemValues = jest.fn();

let mockAccountNetworkSymbol: string | null;

const accountKey = mockAccountKey({ symbol: 'eth', descriptor: 'ethAccount' });

const AMOUNT_TRANSLATION_KEY = 'transactionManagement.review.outputs.summary.amount';
const FEE_TRANSLATION_KEY = 'transactionManagement.review.outputs.summary.maxFee';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountNetworkSymbol: () => mockAccountNetworkSymbol,
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    ReviewOutputItemValues: (props: { translationKey: string; value: string }) => {
        mockReviewOutputItemValues(props);

        return null;
    },
}));

const renderItem = async (stakeType: EarnFormDraftPrefix) =>
    await renderWithStoreProvider(
        <EarnSummaryOutputItem
            accountKey={accountKey}
            stakeType={stakeType}
            amount="1"
            fee="2"
            outputState="active"
            onLayout={() => {}}
        />,
    );

const getRenderedTranslationKeys = () =>
    mockReviewOutputItemValues.mock.calls.map(([props]) => props.translationKey);

describe('EarnSummaryOutputItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<{ symbol: string; stakeType: EarnFormDraftPrefix; isAmountVisible: boolean }>([
        { symbol: 'eth', stakeType: 'stake', isAmountVisible: true },
        { symbol: 'eth', stakeType: 'unstake', isAmountVisible: true },
        { symbol: 'eth', stakeType: 'claim', isAmountVisible: false },
        { symbol: 'sol', stakeType: 'stake', isAmountVisible: true },
        { symbol: 'sol', stakeType: 'unstake', isAmountVisible: false },
        { symbol: 'sol', stakeType: 'claim', isAmountVisible: true },
    ])(
        // The device omits the amount from the Ethereum claim and the Solana unstake summaries.
        'renders the amount row: $isAmountVisible for $symbol $stakeType',
        async ({ symbol, stakeType, isAmountVisible }) => {
            mockAccountNetworkSymbol = symbol;

            await renderItem(stakeType);

            const renderedKeys = getRenderedTranslationKeys();
            expect(renderedKeys.includes(AMOUNT_TRANSLATION_KEY)).toBe(isAmountVisible);
            expect(renderedKeys).toContain(FEE_TRANSLATION_KEY);
        },
    );
});
