import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SkipButton, type SkipButtonProps } from './SkipButton';

const mockAnalyticsReport = jest.fn();

jest.mock('../hooks/useCountrySelectionAnalyticsReport', () => ({
    useCountrySelectionAnalyticsReport: () => mockAnalyticsReport,
}));

describe('SkipButton', () => {
    const renderSkipButton = async (props: Partial<SkipButtonProps>) =>
        await renderWithBasicProvider(<SkipButton onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const onPressMock = jest.fn();

        const { getByText } = await renderSkipButton({ onPress: onPressMock });
        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        );

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should log cancel event on press', async () => {
        const { getByText } = await renderSkipButton({});
        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('cancel');
    });
});
