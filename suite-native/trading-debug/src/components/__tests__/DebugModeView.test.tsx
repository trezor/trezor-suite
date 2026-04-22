import { Text } from '@suite-native/atoms';
import { renderWithProviders } from '@suite-native/test-utils';

import { DebugModeView } from '../DebugModeView';

let mockDebugMode: boolean;

jest.mock('../../hooks/useTradingDebugModeFlag', () => ({
    useTradingDebugModeFlag: () => mockDebugMode,
}));

describe('DebugModeView', () => {
    const renderDebugModeView = () =>
        renderWithProviders(
            <DebugModeView>
                <Text>TEST TEXT</Text>
            </DebugModeView>,
            { providers: ['intl'] },
        );

    beforeEach(() => {
        mockDebugMode = false;
    });

    it('should render nothing when debug mode is disabled', () => {
        const { toJSON } = renderDebugModeView();

        expect(toJSON()).toBeNull();
    });

    it('should render children when debug mode is enabled', () => {
        mockDebugMode = true;
        const { getByText } = renderDebugModeView();

        expect(getByText('TEST TEXT')).toBeOnTheScreen();
    });
});
