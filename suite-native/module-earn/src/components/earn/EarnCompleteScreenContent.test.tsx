import { type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';

import { stakingProductIdSchema } from '@suite-common/earn-staking-common';
import { buildUserFeedbackData, sendFeedbackThunk } from '@suite-common/feedback';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { EarnCompleteScreenContent } from './EarnCompleteScreenContent';

type CompleteScreenProps = ComponentProps<typeof EarnCompleteScreenContent>;
type FeedbackCase = {
    type: CompleteScreenProps['type'];
    category: NonNullable<CompleteScreenProps['feedbackFeature']>;
    feedbackContext: CompleteScreenProps['feedbackContext'];
};

type MockScreenProps = PropsWithChildren<{ footer: ReactNode }>;

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children, footer }: MockScreenProps) => (
        <>
            {children}
            {footer}
        </>
    ),
}));

const mockUnwrapFeedback = jest.fn<Promise<void>, []>();

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackThunk: jest.fn(() => () => ({ unwrap: mockUnwrapFeedback })),
}));

describe('Earn completion feedback analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUnwrapFeedback.mockReset().mockResolvedValue(undefined);
    });

    const vaultContext: FeedbackCase['feedbackContext'] = {
        vaultId: 'public-vault-id',
    };
    const stakingContext: FeedbackCase['feedbackContext'] = {
        productId: stakingProductIdSchema.parse('eth:eth:everstake:pooled'),
    };
    const wrappedContext: FeedbackCase['feedbackContext'] = {
        networkSymbol: asNetworkSymbol('eth'),
        tokenSymbols: ['WETH'],
    };

    it.each<FeedbackCase>([
        { type: 'deposit', category: 'yield', feedbackContext: vaultContext },
        { type: 'withdraw', category: 'yield', feedbackContext: vaultContext },
        { type: 'redeem', category: 'yield', feedbackContext: vaultContext },
        {
            type: 'claim',
            category: 'yield',
            feedbackContext: {
                networkSymbol: asNetworkSymbol('base'),
                tokenSymbols: ['MORPHO', 'USDC'],
            },
        },
        { type: 'wrap', category: 'yield', feedbackContext: wrappedContext },
        { type: 'unwrap', category: 'yield', feedbackContext: wrappedContext },
        { type: 'stake', category: 'staking', feedbackContext: stakingContext },
        { type: 'unstake', category: 'staking', feedbackContext: stakingContext },
        { type: 'claim', category: 'staking', feedbackContext: stakingContext },
    ])(
        'reports the completed operation and its asset context for $category/$type',
        async ({ type, category, feedbackContext }) => {
            const { vaultId, ...assetContext } = feedbackContext;
            const { tokenSymbols } = assetContext;
            const analyticsContext = {
                ...assetContext,
                category,
                context: type,
                ...(vaultId && { provider: vaultId }),
            };
            const hasYieldInteraction =
                category === 'yield' && ['deposit', 'withdraw', 'redeem', 'claim'].includes(type);
            const services: NativeAnalyticsDep = {
                analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
            };
            await renderWithStoreProvider(
                <EarnCompleteScreenContent
                    buttonTranslationId="generic.buttons.close"
                    onButtonPress={mock()}
                    rows={[]}
                    title="Complete"
                    type={type}
                    feedbackFeature={category}
                    feedbackContext={feedbackContext}
                />,
                { services, preloadedState: { device: { selectedDevice: undefined } } },
            );

            await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
            await fireEvent.changeText(
                screen.getByTestId('@feedback-form/description-input'),
                'Private feedback text',
            );
            await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

            expect(services.analytics.report).toHaveBeenCalledTimes(hasYieldInteraction ? 3 : 2);
            expect(services.analytics.report).toHaveBeenNthCalledWith(1, {
                type: 'feedback/rating-selected',
                payload: { ...analyticsContext, rating: '4' },
            });
            expect(services.analytics.report).toHaveBeenNthCalledWith(2, {
                type: 'feedback/sent',
                payload: analyticsContext,
            });
            if (hasYieldInteraction) {
                expect(services.analytics.report).toHaveBeenNthCalledWith(3, {
                    type: 'yield/interaction',
                    payload: { ...feedbackContext, element: 'feedback-submit', value: '4' },
                });
            }
            expect(jest.mocked(sendFeedbackThunk).mock.calls).toStrictEqual([
                [
                    {
                        type: 'SUGGESTION',
                        payload: {
                            category: 'feature',
                            feature: category,
                            context: type,
                            ...feedbackContext,
                            ...(tokenSymbols && { tokenSymbols }),
                            rating: '4',
                            description: 'Private feedback text',
                            ...buildUserFeedbackData(),
                        },
                    },
                ],
            ]);
        },
    );

    it('keeps the draft after a failed submission and reports the accepted retry', async () => {
        mockUnwrapFeedback.mockRejectedValueOnce('Failed to send feedback');
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        await renderWithStoreProvider(
            <EarnCompleteScreenContent
                buttonTranslationId="generic.buttons.close"
                onButtonPress={mock()}
                rows={[]}
                title="Complete"
                type="stake"
                feedbackFeature="staking"
                feedbackContext={stakingContext}
            />,
            { services, preloadedState: { device: { selectedDevice: undefined } } },
        );

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        const descriptionInput = screen.getByTestId('@feedback-form/description-input');
        await fireEvent.changeText(descriptionInput, 'Feedback draft');
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(descriptionInput).toHaveProp('value', 'Feedback draft');
        expect(services.analytics.report).toHaveBeenCalledTimes(1);

        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(services.analytics.report).toHaveBeenNthCalledWith(2, {
            type: 'feedback/sent',
            payload: { category: 'staking', context: 'stake', ...stakingContext },
        });
    });
});
