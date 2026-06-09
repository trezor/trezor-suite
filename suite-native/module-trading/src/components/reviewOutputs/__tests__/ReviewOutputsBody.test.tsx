import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { oneInchFusionPlusWithEip712SignDataQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { ReviewOutputsBody, type ReviewOutputsBodyProps } from '../ReviewOutputsBody';

const defaultProps: ReviewOutputsBodyProps = {
    prefix: 'trading-exchange',
    accountKey: 'ACCOUNT_KEY' as AccountKey,
    tokenContract: 'TOKEN_CONTRACT' as TokenAddress,
    exchangeFlowType: 'swap',
    shouldDisplayReviewList: true,
};

describe('ReviewOutputsBody', () => {
    const renderReviewOutputsBody = (props: Partial<ReviewOutputsBodyProps> = {}) =>
        renderWithTradingProvider(<ReviewOutputsBody {...defaultProps} {...props} />, {
            tradeType: 'exchange',
        });

    it('renders loading skeleton when shouldDisplayReviewList is false', () => {
        const { getByTestId } = renderReviewOutputsBody({ shouldDisplayReviewList: false });

        expect(getByTestId('@trading/outputs-review/skeleton')).toBeOnTheScreen();
    });

    it('renders output item list when shouldDisplayReviewList is true', () => {
        const { getByText, queryByTestId } = renderReviewOutputsBody({});

        // invalid account id is provided, expect error
        expect(
            getByText(
                new RegExp(
                    getTranslation('moduleTrading.accountScreen.accountEmpty.viewOnly.title'),
                ),
            ),
        ).toBeOnTheScreen();
        expect(queryByTestId('@trading/outputs-review/skeleton')).not.toBeOnTheScreen();
    });

    it('renders SignDataMessageReview when exchangeFlowType is sign-data', () => {
        const { getByText, queryByText } = renderWithTradingProvider(
            <ReviewOutputsBody {...defaultProps} exchangeFlowType="sign-data" />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                selectedQuote: oneInchFusionPlusWithEip712SignDataQuote,
                            },
                        },
                    },
                },
            },
        );

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.heading')),
        ).toBeOnTheScreen();
        // ReviewOutputItemList renders "Account not found" for invalid keys; sign-data skips it
        expect(
            queryByText(getTranslation('moduleTrading.accountScreen.accountEmpty.viewOnly.title')),
        ).toBeNull();
    });
});
