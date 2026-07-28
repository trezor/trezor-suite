import { type ReactNode } from 'react';
import { Text } from 'react-native';

import { useRoute } from '@react-navigation/native';

import { ReceiveAddressVerificationSource } from '@suite-native/navigation';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { ReceiveAddressVerificationScreen } from './ReceiveAddressVerificationScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: jest.fn(),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    ContinueOnTrezorScreenContent: ({ titleTxKey }: { titleTxKey: string }) => (
        <Text>{titleTxKey}</Text>
    ),
    DeviceInteractionScreenWrapper: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useInterceptNativeNavigation: jest.fn(),
}));

describe('ReceiveAddressVerificationScreen', () => {
    const mockUseRoute = jest.mocked(useRoute);

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRoute.mockReturnValue({
            params: { source: ReceiveAddressVerificationSource.Pasted },
        } as never);
    });

    it('displays pasted address verification instructions', () => {
        const { getByText } = renderWithBasicProvider(<ReceiveAddressVerificationScreen />);

        expect(getByText('moduleReceive.addressVerificationScreen.pastedTitle')).toBeTruthy();
    });

    it('displays shared address verification instructions', () => {
        mockUseRoute.mockReturnValue({
            params: { source: ReceiveAddressVerificationSource.Shared },
        } as never);

        const { getByText } = renderWithBasicProvider(<ReceiveAddressVerificationScreen />);

        expect(getByText('moduleReceive.addressVerificationScreen.sharedTitle')).toBeTruthy();
    });
});
