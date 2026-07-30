import { type AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import {
    getEthAccount,
    oneInchFusionPlusWithEip712SignDataQuote,
    oneInchFusionPlusWithoutEip712SignDataQuote,
} from '@suite-native/trading-fixtures';

import { SignDataMessageReview } from './SignDataMessageReview';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const ethAccount = getEthAccount();

const signDataPayload = {
    type: 'eip712-typed-data' as const,
    data: {
        domain: {
            name: '1inch Aggregation Router',
            version: '6',
            chainId: 1,
            verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65',
        },
        primaryType: 'Order',
        message: {
            maker: '0x9cd02a26cd336d0fe784fb7995f6e5c9e3776258',
            makerAsset: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            makingAmount: '5000000',
            takingAmount: '4267645',
            permit: {
                spender: '0xrouter',
                amount: '42',
            },
        },
    },
};

const quoteWithEip712SignData = {
    ...oneInchFusionPlusWithEip712SignDataQuote,
    signData: signDataPayload,
};

const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: {
        trading: {
            exchange: {
                tradingAccountKey: ethAccount.key as AccountKey,
                selectedQuote: quoteWithEip712SignData,
            },
        },
        accounts: [ethAccount],
    },
};

const renderSignDataMessageReview = (
    overrides: PreloadedStatePartial<TradingTestPreloadedState> = baseOverrides,
) =>
    renderWithTradingProvider(<SignDataMessageReview />, {
        tradeType: 'exchange',
        overrides,
    });

describe('SignDataMessageReview', () => {
    it('should render nothing when quote has no signData', () => {
        const { toJSON } = renderSignDataMessageReview({
            wallet: {
                trading: {
                    exchange: {
                        selectedQuote: oneInchFusionPlusWithoutEip712SignDataQuote,
                    },
                },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when signData type is not eip712-typed-data', () => {
        const { toJSON } = renderSignDataMessageReview({
            wallet: {
                trading: {
                    exchange: {
                        selectedQuote: {
                            ...oneInchFusionPlusWithEip712SignDataQuote,
                            signData: { type: 'slip24', data: {} } as any,
                        },
                    },
                },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should render heading', () => {
        const { getByText } = renderSignDataMessageReview();

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.heading')),
        ).toBeOnTheScreen();
    });

    it('should render domain card with simplified JSON', () => {
        const { getByText } = renderSignDataMessageReview();

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.domain')),
        ).toBeOnTheScreen();
        expect(getByText(/1inch Aggregation Router/)).toBeOnTheScreen();
    });

    it('should render message card with labeled field rows', () => {
        const { getByText } = renderSignDataMessageReview();

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.message')),
        ).toBeOnTheScreen();
        expect(getByText('maker')).toBeOnTheScreen();
        expect(getByText('0x9cd02a26cd336d0fe784fb7995f6e5c9e3776258')).toBeOnTheScreen();
        expect(getByText('makingAmount')).toBeOnTheScreen();
        expect(getByText('5000000')).toBeOnTheScreen();
        expect(getByText('permit')).toBeOnTheScreen();
        expect(getByText(/spender: 0xrouter/)).toBeOnTheScreen();
        expect(getByText(/amount: 42/)).toBeOnTheScreen();
    });

    it('should render address card when send account is available', () => {
        const { getByText } = renderSignDataMessageReview();

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.address')),
        ).toBeOnTheScreen();
    });

    it('should not render address card when send account is not found', () => {
        const { queryByText } = renderSignDataMessageReview({
            wallet: {
                trading: {
                    exchange: {
                        tradingAccountKey: 'nonexistent-key' as AccountKey,
                        selectedQuote: quoteWithEip712SignData,
                    },
                },
            },
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.address')),
        ).toBeNull();
    });
});
