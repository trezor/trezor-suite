import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

import { ProviderConfirmationStatusInfo } from './ProviderConfirmationStatusInfo';

let mockUseProviderConfirmationStatus: ProviderConfirmationStatus;

jest.mock('../hooks/useProviderConfirmationStatus', () => ({
    useProviderConfirmationStatus: () => mockUseProviderConfirmationStatus,
}));

describe('ProviderConfirmationStatusInfo', () => {
    const renderProviderConfirmationStatusInfo = async (onConfirmationComplete?: jest.Mock) =>
        await renderWithBasicProvider(
            <ProviderConfirmationStatusInfo
                companyName="MoonPay"
                onConfirmationComplete={onConfirmationComplete}
            />,
        );

    const finishSpinnerAnimation = async (
        container: Awaited<ReturnType<typeof renderProviderConfirmationStatusInfo>>['container'],
    ) => {
        const [spinner] = container.queryAll(
            instance => instance.props.loop === false && instance.props.speed === 1.5,
        );

        if (!spinner) {
            throw new Error('Spinner animation was not rendered.');
        }

        const event = { nativeEvent: { isCancelled: false } };
        await fireEvent(spinner, 'animationFinish', event);
        await fireEvent(spinner, 'animationFinish', event);
        await fireEvent(spinner, 'animationFinish', event);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<ProviderConfirmationStatus>(['inactive', 'confirmation_success', 'window_opened'])(
        'should render nothing when providerConfirmationStatus is [%s]',
        async providerConfirmationStatus => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { toJSON } = await renderProviderConfirmationStatusInfo();

            expect(toJSON()).toBeNull();
        },
    );

    it.each<[string, ProviderConfirmationStatus]>([
        [
            getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                companyName: 'MoonPay',
            }),
            'window_closed_incomplete',
        ],
        [
            getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                companyName: 'MoonPay',
            }),
            'window_closed_with_success',
        ],
        [
            getTranslation(
                'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title',
            ),
            'confirmation_failed',
        ],
    ])(
        'should render "%s" when providerConfirmationStatus is [%s]',
        async (expectedTitle, providerConfirmationStatus) => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { getByText } = await renderProviderConfirmationStatusInfo();

            expect(getByText(expectedTitle)).toBeTruthy();
        },
    );

    it('should show the success animation before hiding the confirmation status', async () => {
        mockUseProviderConfirmationStatus = 'window_closed_with_success';
        const onConfirmationComplete = jest.fn();
        const { container, getByText, queryByText, rerender } =
            await renderProviderConfirmationStatusInfo(onConfirmationComplete);

        mockUseProviderConfirmationStatus = 'confirmation_success';
        await rerender(
            <ProviderConfirmationStatusInfo
                companyName="MoonPay"
                onConfirmationComplete={onConfirmationComplete}
            />,
        );

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                    companyName: 'MoonPay',
                }),
            ),
        ).toBeTruthy();
        expect(onConfirmationComplete).not.toHaveBeenCalled();

        await finishSpinnerAnimation(container);

        expect(
            queryByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                    companyName: 'MoonPay',
                }),
            ),
        ).toBeNull();
        expect(onConfirmationComplete).toHaveBeenCalledWith('success');
    });

    it('should complete immediately when there is no success animation to show', async () => {
        mockUseProviderConfirmationStatus = 'confirmation_success';
        const onConfirmationComplete = jest.fn();

        await renderProviderConfirmationStatusInfo(onConfirmationComplete);

        expect(onConfirmationComplete).toHaveBeenCalledWith('success');
    });

    it('should show the failure animation before rendering the failure status', async () => {
        mockUseProviderConfirmationStatus = 'window_closed_incomplete';
        const { container, getByText, queryByText, rerender } =
            await renderProviderConfirmationStatusInfo();

        mockUseProviderConfirmationStatus = 'confirmation_failed';
        await rerender(<ProviderConfirmationStatusInfo companyName="MoonPay" />);

        const failureTitle = getTranslation(
            'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title',
        );

        expect(queryByText(failureTitle)).toBeNull();

        await finishSpinnerAnimation(container);

        expect(getByText(failureTitle)).toBeTruthy();
    });

    it('should render a quote error immediately', async () => {
        mockUseProviderConfirmationStatus = 'window_closed_incomplete';

        const { getByText } = await renderWithBasicProvider(
            <ProviderConfirmationStatusInfo companyName="MoonPay" quoteStatus="ERROR" />,
        );

        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title',
                ),
            ),
        ).toBeTruthy();
    });
});
