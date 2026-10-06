import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { DebugModeView } from './DebugModeView';

let mockDebugMode: boolean;

jest.mock('../hooks/useTradingDebugModeFlag', () => ({
    useTradingDebugModeFlag: () => mockDebugMode,
}));

describe('DebugModeView', () => {
    const renderDebugModeView = async () =>
        await renderWithBasicProvider(
            <DebugModeView>
                <Text>TEST TEXT</Text>
            </DebugModeView>,
        );

    beforeEach(() => {
        mockDebugMode = false;
    });

    it('should render nothing when debug mode is disabled', async () => {
        const { toJSON } = await renderDebugModeView();

        expect(toJSON()).toBeNull();
    });

    it('should render children when debug mode is enabled', async () => {
        mockDebugMode = true;
        const { getByText } = await renderDebugModeView();

        expect(getByText('TEST TEXT')).toBeOnTheScreen();
    });
});
