import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SkipButton, type SkipButtonProps } from '../SkipButton';

const mockAnalyticsReport = jest.fn();

jest.mock('../../hooks/useCountrySelectionAnalyticsReport', () => ({
    useCountrySelectionAnalyticsReport: () => mockAnalyticsReport,
}));

describe('SkipButton', () => {
    const renderSkipButton = (props: Partial<SkipButtonProps>) =>
        renderWithBasicProvider(<SkipButton onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onPress callback when pressed', () => {
        const onPressMock = jest.fn();

        const { getByText } = renderSkipButton({ onPress: onPressMock });
        fireEvent.press(getByText(getTranslation('tradingResidence.locationSettings.skipButton')));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should log cancel event on press', () => {
        const { getByText } = renderSkipButton({});
        fireEvent.press(getByText(getTranslation('tradingResidence.locationSettings.skipButton')));

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('cancel');
    });
});
