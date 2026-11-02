import { type PropsWithChildren, type ReactNode } from 'react';

import { sendFeedbackThunk } from '@suite-common/feedback';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { EarnCompleteScreenContent } from './EarnCompleteScreenContent';

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

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackThunk: jest.fn(() => ({ type: 'test/sendFeedback' })),
}));

describe('Earn completion feedback analytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { type: 'deposit', category: 'yield', vaultId: 'public-vault-id' },
        { type: 'withdraw', category: 'yield', vaultId: 'public-vault-id' },
        { type: 'redeem', category: 'yield', vaultId: 'public-vault-id' },
        { type: 'claim', category: 'yield', vaultId: undefined },
        { type: 'wrap', category: 'yield', vaultId: undefined },
        { type: 'unwrap', category: 'yield', vaultId: undefined },
        { type: 'stake', category: 'staking', vaultId: undefined },
        { type: 'unstake', category: 'staking', vaultId: undefined },
    ] as const)(
        'reports the available provider for $category/$type',
        async ({ type, category, vaultId }) => {
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
                    vaultId={vaultId}
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
                payload: { rating: '4', category, context: type, provider: vaultId },
            });
            expect(services.analytics.report).toHaveBeenNthCalledWith(2, {
                type: 'feedback/sent',
                payload: { category, context: type, provider: vaultId },
            });
            if (hasYieldInteraction) {
                expect(services.analytics.report).toHaveBeenNthCalledWith(3, {
                    type: 'yield/interaction',
                    payload: { element: 'feedback-submit', value: '4', vaultId },
                });
            }
            expect(sendFeedbackThunk).toHaveBeenCalledWith({
                type: 'SUGGESTION',
                payload: expect.objectContaining({
                    feature: category,
                    context: type,
                    vaultId,
                    description: 'Private feedback text',
                }),
            });
        },
    );
});
