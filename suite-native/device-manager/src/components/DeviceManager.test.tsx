import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { DeviceManager } from './DeviceManager';
import { useDeviceManager } from '../hooks/useDeviceManager';

jest.mock('./DeviceSwitch', () => ({
    DeviceSwitch: () => null,
}));

jest.mock('./DeviceManagerContent', () => ({
    DeviceManagerContent: () => <Text>DeviceManagerContent</Text>,
}));

jest.mock('../hooks/useDeviceManager');

const mockUseDeviceManager = jest.mocked(useDeviceManager);

describe('DeviceManager', () => {
    const renderDeviceManager = async () => await renderWithBasicProvider(<DeviceManager />);

    it('renders DeviceManagerContent when the device manager is visible', async () => {
        mockUseDeviceManager.mockReturnValue({
            isDeviceManagerVisible: true,
            setIsDeviceManagerVisible: jest.fn(),
        });

        const { getByText } = await renderDeviceManager();

        expect(getByText('DeviceManagerContent')).toBeOnTheScreen();
    });

    it('does not render DeviceManagerContent when the device manager is hidden', async () => {
        mockUseDeviceManager.mockReturnValue({
            isDeviceManagerVisible: false,
            setIsDeviceManagerVisible: jest.fn(),
        });

        const { queryByText } = await renderDeviceManager();

        expect(queryByText('DeviceManagerContent')).not.toBeOnTheScreen();
    });
});
