import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

import { ProviderConfirmationStatusInfo } from './ProviderConfirmationStatusInfo';

let mockUseProviderConfirmationStatus: ProviderConfirmationStatus;

jest.mock('../hooks/useProviderConfirmationStatus', () => ({
    useProviderConfirmationStatus: () => mockUseProviderConfirmationStatus,
}));

describe('ProviderConfirmationStatusInfo', () => {
    const renderProviderConfirmationStatusInfo = (onConfirmationComplete?: jest.Mock) =>
        renderWithBasicProvider(
            <ProviderConfirmationStatusInfo
                companyName="MoonPay"
                onConfirmationComplete={onConfirmationComplete}
            />,
        );

    const finishSpinnerAnimation = (
        getByProps: ReturnType<typeof renderProviderConfirmationStatusInfo>['UNSAFE_getByProps'],
    ) => {
        const spinner = getByProps({ loop: false, speed: 1.5 });

        fireEvent(spinner, 'animationFinish');
        fireEvent(spinner, 'animationFinish');
        fireEvent(spinner, 'animationFinish');
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each<ProviderConfirmationStatus>(['inactive', 'confirmation_success', 'window_opened'])(
        'should render nothing when providerConfirmationStatus is [%s]',
        providerConfirmationStatus => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { toJSON } = renderProviderConfirmationStatusInfo();

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
        (expectedTitle, providerConfirmationStatus) => {
            mockUseProviderConfirmationStatus = providerConfirmationStatus;

            const { getByText } = renderProviderConfirmationStatusInfo();

            expect(getByText(expectedTitle)).toBeTruthy();
        },
    );

    it('should show the success animation before hiding the confirmation status', () => {
        mockUseProviderConfirmationStatus = 'window_closed_with_success';
        const onConfirmationComplete = jest.fn();
        const { getByText, queryByText, rerender, UNSAFE_getByProps } =
            renderProviderConfirmationStatusInfo(onConfirmationComplete);

        mockUseProviderConfirmationStatus = 'confirmation_success';
        rerender(
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

        finishSpinnerAnimation(UNSAFE_getByProps);

        expect(
            queryByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                    companyName: 'MoonPay',
                }),
            ),
        ).toBeNull();
        expect(onConfirmationComplete).toHaveBeenCalledWith('success');
    });

    it('should complete immediately when there is no success animation to show', () => {
        mockUseProviderConfirmationStatus = 'confirmation_success';
        const onConfirmationComplete = jest.fn();

        renderProviderConfirmationStatusInfo(onConfirmationComplete);

        expect(onConfirmationComplete).toHaveBeenCalledWith('success');
    });

    it('should show the failure animation before rendering the failure status', () => {
        mockUseProviderConfirmationStatus = 'window_closed_incomplete';
        const { getByText, queryByText, rerender, UNSAFE_getByProps } =
            renderProviderConfirmationStatusInfo();

        mockUseProviderConfirmationStatus = 'confirmation_failed';
        rerender(<ProviderConfirmationStatusInfo companyName="MoonPay" />);

        const failureTitle = getTranslation(
            'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title',
        );

        expect(queryByText(failureTitle)).toBeNull();

        finishSpinnerAnimation(UNSAFE_getByProps);

        expect(getByText(failureTitle)).toBeTruthy();
    });

    it('should render a quote error immediately', () => {
        mockUseProviderConfirmationStatus = 'window_closed_incomplete';

        const { getByText } = renderWithBasicProvider(
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
