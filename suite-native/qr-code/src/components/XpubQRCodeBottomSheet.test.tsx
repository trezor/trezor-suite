import { type ComponentProps } from 'react';
import { View } from 'react-native';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { showXpubOnDevice } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type BottomSheetModal } from '@suite-native/atoms';
import { DeviceAuthorizationStep } from '@suite-native/device-authorization';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithStoreProvider, userEvent } from '@suite-native/test-utils-store';
import TrezorConnect from '@trezor/connect';

import { type QRCode } from './QRCode';
import { XpubQRCodeBottomSheet } from './XpubQRCodeBottomSheet';

type MockSheetProps = ComponentProps<typeof BottomSheetModal>;
type MockQRCodeProps = ComponentProps<typeof QRCode>;

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    BottomSheetModal: ({ children, onDismiss }: MockSheetProps) => (
        <View testID="sheet" onTouchEnd={onDismiss}>
            {children}
        </View>
    ),
}));

jest.mock('./QRCode', () => ({
    QRCode: ({ data }: MockQRCodeProps) => <View testID="qr-code" accessibilityLabel={data} />,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    showXpubOnDevice: jest.fn(),
}));

const mockCopy = jest.fn();
const mockShowToast = jest.fn();
jest.mock('@suite-native/clipboard', () => ({ useCopyToClipboard: () => mockCopy }));
jest.mock('@suite-native/toasts', () => ({ useToast: () => ({ showToast: mockShowToast }) }));

type PublicKeyResponse = Awaited<ReturnType<typeof showXpubOnDevice>>;

const descriptor = "tr([71d98c03/86'/0'/0']xpub6CXYp/<0;1>/*)";
const firmwareDescriptor = 'tr([71d98c03/86h/0h/0h]xpub6CXYp/<0;1>/*)#gvfjd7ak';
const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor(descriptor),
    descriptorChecksum: undefined,
});
const device = mockSuiteDevice({ connected: true, available: true });

const publicKeyResponse = (displayablePublicKey: string): PublicKeyResponse => ({
    success: true,
    payload: {
        displayablePublicKey,
        xpub: 'xpub6CXYp',
        path: [],
        serializedPath: account.path,
        childNum: 0,
        chainCode: '',
        publicKey: '',
        fingerprint: 0,
        depth: 3,
    },
});

const showLabel = () =>
    getTranslation('moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton');
const copyLabel = () =>
    getTranslation('moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.copyButton');

const renderSheet = (sheetAccount: Account = account, connected = true) => {
    const onClose = jest.fn();

    return renderWithStoreProvider(
        <XpubQRCodeBottomSheet
            accountKey={sheetAccount.key}
            qrCodeData={descriptor}
            onClose={onClose}
            ref={null}
        />,
        {
            preloadedState: {
                wallet: { accounts: [sheetAccount] },
                device: { selectedDevice: { ...device, connected } },
                deviceAuthorization: { deviceAuthorizationStep: DeviceAuthorizationStep.Idle },
            },
        },
    ).then(result => ({ ...result, onClose, user: userEvent.setup() }));
};

describe('XpubQRCodeBottomSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(showXpubOnDevice).mockReset();
        jest.spyOn(TrezorConnect, 'cancel').mockResolvedValue(undefined);
    });

    it.each([firmwareDescriptor, 'xpub6CXYp'])(
        'shows and copies the device value %s even when the stored checksum is missing',
        async displayablePublicKey => {
            const confirmation = Promise.withResolvers<PublicKeyResponse>();
            jest.mocked(showXpubOnDevice)
                .mockResolvedValueOnce(publicKeyResponse(displayablePublicKey))
                .mockReturnValueOnce(confirmation.promise);
            const screen = await renderSheet();

            await screen.user.press(screen.getByText(showLabel()));

            expect(showXpubOnDevice).toHaveBeenNthCalledWith(1, device, account, {
                showOnTrezor: false,
            });
            expect(showXpubOnDevice).toHaveBeenNthCalledWith(2, device, account);
            expect(screen.getByText(displayablePublicKey)).toBeOnTheScreen();
            expect(screen.getByTestId('qr-code')).toHaveProp(
                'accessibilityLabel',
                displayablePublicKey,
            );
            expect(screen.queryByText(copyLabel())).not.toBeOnTheScreen();

            await act(() => confirmation.resolve(publicKeyResponse(displayablePublicKey)));
            await fireEvent(screen.getByText(displayablePublicKey), 'longPress');
            expect(mockCopy).toHaveBeenLastCalledWith(displayablePublicKey, expect.any(String));
            await screen.user.press(screen.getByText(copyLabel()));
            expect(mockCopy).toHaveBeenLastCalledWith(displayablePublicKey, expect.any(String));
            expect(screen.onClose).toHaveBeenCalledTimes(1);
        },
    );

    it('uses the final response for display and copy', async () => {
        jest.mocked(showXpubOnDevice)
            .mockResolvedValueOnce(publicKeyResponse(firmwareDescriptor))
            .mockResolvedValueOnce(publicKeyResponse('confirmed-key'));
        const screen = await renderSheet();

        await screen.user.press(screen.getByText(showLabel()));

        expect(screen.getByText('confirmed-key')).toBeOnTheScreen();
        await screen.user.press(screen.getByText(copyLabel()));
        expect(mockCopy).toHaveBeenLastCalledWith('confirmed-key', expect.any(String));
    });

    it('cancels a dismissed read without starting confirmation or revealing its late response', async () => {
        const read = Promise.withResolvers<PublicKeyResponse>();
        jest.mocked(showXpubOnDevice).mockReturnValueOnce(read.promise);
        const screen = await renderSheet();

        await screen.user.press(screen.getByText(showLabel()));
        expect(screen.queryByTestId('qr-code')).not.toBeOnTheScreen();
        await fireEvent(screen.getByTestId('sheet'), 'touchEnd');
        await act(() => read.resolve(publicKeyResponse(firmwareDescriptor)));

        expect(TrezorConnect.cancel).toHaveBeenCalledTimes(1);
        expect(showXpubOnDevice).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('qr-code')).not.toBeOnTheScreen();
        expect(screen.getByText(showLabel())).toBeOnTheScreen();
    });

    it('clears the value on dismissal and ignores a late confirmation', async () => {
        const confirmation = Promise.withResolvers<PublicKeyResponse>();
        jest.mocked(showXpubOnDevice)
            .mockResolvedValueOnce(publicKeyResponse(firmwareDescriptor))
            .mockReturnValueOnce(confirmation.promise);
        const screen = await renderSheet();

        await screen.user.press(screen.getByText(showLabel()));
        await fireEvent(screen.getByTestId('sheet'), 'touchEnd');
        await act(() => confirmation.resolve(publicKeyResponse(firmwareDescriptor)));

        expect(screen.queryByTestId('qr-code')).not.toBeOnTheScreen();
        expect(screen.queryByText(copyLabel())).not.toBeOnTheScreen();
        expect(TrezorConnect.cancel).toHaveBeenCalledTimes(1);
    });

    it('cancels an in-flight read when the sheet unmounts', async () => {
        const read = Promise.withResolvers<PublicKeyResponse>();
        jest.mocked(showXpubOnDevice).mockReturnValueOnce(read.promise);
        const screen = await renderSheet();

        await screen.user.press(screen.getByText(showLabel()));
        await screen.unmount();
        await act(() => read.resolve(publicKeyResponse(firmwareDescriptor)));

        expect(TrezorConnect.cancel).toHaveBeenCalledTimes(1);
        expect(showXpubOnDevice).toHaveBeenCalledTimes(1);
    });

    it('closes on a failed read without starting confirmation', async () => {
        jest.mocked(showXpubOnDevice).mockResolvedValueOnce({
            success: false,
            error: { code: 'Failure_ActionCancelled', message: 'Cancelled' },
        });
        const screen = await renderSheet();

        await screen.user.press(screen.getByText(showLabel()));

        expect(showXpubOnDevice).toHaveBeenCalledTimes(1);
        expect(screen.onClose).toHaveBeenCalledTimes(1);
        expect(mockShowToast).not.toHaveBeenCalled();
        expect(screen.queryByTestId('qr-code')).not.toBeOnTheScreen();
    });

    it('shows an imported descriptor without contacting a device', async () => {
        const screen = await renderSheet({ ...account, imported: true });

        expect(screen.getByText(descriptor)).toBeOnTheScreen();
        await screen.user.press(screen.getByText(copyLabel()));
        expect(mockCopy).toHaveBeenLastCalledWith(descriptor, expect.any(String));
        expect(showXpubOnDevice).not.toHaveBeenCalled();
    });

    it('allows the stored descriptor to be shown explicitly when disconnected', async () => {
        const screen = await renderSheet(account, false);

        await screen.user.press(screen.getByText(showLabel()));
        await screen.user.press(
            screen.getByText(
                getTranslation(
                    'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.viewOnlyWarning.primaryButton',
                ),
            ),
        );

        expect(screen.getByText(descriptor)).toBeOnTheScreen();
        expect(showXpubOnDevice).not.toHaveBeenCalled();
    });
});
