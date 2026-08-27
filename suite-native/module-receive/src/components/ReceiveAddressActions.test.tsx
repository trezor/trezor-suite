import { Share } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { ReceiveAddressVerificationSource, ReceiveStackRoutes } from '@suite-native/navigation';
import { renderWithBasicProvider, userEvent, waitFor } from '@suite-native/test-utils';

import { ReceiveAddressActions } from './ReceiveAddressActions';
import { ReceiveAddressInteractionsProvider } from './ReceiveAddressInteractionsProvider';

const mockCopyToClipboard = jest.fn();
const mockOpenCopiedAddressBottomSheet = jest.fn();
const mockCloseCopiedAddressBottomSheet = jest.fn();
const mockOpenSharedAddressBottomSheet = jest.fn();
const mockCloseSharedAddressBottomSheet = jest.fn();
const mockShare = jest.spyOn(Share, 'share');
const mockUseBottomSheetModal = jest.fn();
const mockNavigate = jest.fn();
const mockAnalyticsReport = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mockAnalyticsReport),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
}));

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => mockUseBottomSheetModal(),
}));

describe('ReceiveAddressActions', () => {
    const accountKey = mockAccountKey();
    const address = 'bc1qreceiveaddress';
    const addressPath = "m/84'/0'/0'/0/0";
    const mockUseNavigation = jest.mocked(useNavigation);

    const renderActions = async () =>
        await renderWithBasicProvider(
            <ReceiveAddressInteractionsProvider
                accountKey={accountKey}
                address={address}
                addressPath={addressPath}
            >
                <ReceiveAddressActions address={address} />
            </ReceiveAddressInteractionsProvider>,
            { services },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockCopyToClipboard.mockResolvedValue(undefined);
        mockShare.mockResolvedValue({ action: Share.sharedAction });
        mockUseNavigation.mockReturnValue({ navigate: mockNavigate } as never);
        mockUseBottomSheetModal
            .mockReturnValueOnce({
                bottomSheetRef: { current: null },
                openModal: mockOpenCopiedAddressBottomSheet,
                closeModal: mockCloseCopiedAddressBottomSheet,
            })
            .mockReturnValueOnce({
                bottomSheetRef: { current: null },
                openModal: mockOpenSharedAddressBottomSheet,
                closeModal: mockCloseSharedAddressBottomSheet,
            });
    });

    it('opens the verification sheet after copying the address', async () => {
        const { getByText } = await renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.copyButton')));

        await waitFor(() => {
            expect(mockCopyToClipboard).toHaveBeenCalledWith(address, undefined, {
                shouldShowToast: false,
            });
            expect(mockOpenCopiedAddressBottomSheet).toHaveBeenCalledTimes(1);
            expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.receiveCopyAddressEvent.name,
            });
        });
    });

    it('closes the sheet and opens address verification', async () => {
        const { getByTestId } = await renderActions();

        await userEvent.press(getByTestId('@receive/address-verification/pasted/verify-button'));

        expect(mockCloseCopiedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            accountKey,
            addressPath,
            source: ReceiveAddressVerificationSource.Pasted,
        });
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveStartVerificationEvent.name,
        });
    });

    it('opens address verification directly', async () => {
        const { getByText } = await renderActions();

        await userEvent.press(getByText(getTranslation('moduleReceive.addressActions.verify')));

        expect(mockCloseCopiedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockCloseSharedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            accountKey,
            addressPath,
            source: ReceiveAddressVerificationSource.Verified,
        });
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveStartVerificationEvent.name,
        });
    });

    it('opens shared address verification after sharing', async () => {
        const { getByText, getByTestId } = await renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.shareButton')));
        await userEvent.press(getByTestId('@receive/address-verification/shared/verify-button'));

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockCloseSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            accountKey,
            addressPath,
            source: ReceiveAddressVerificationSource.Shared,
        });
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveShareAddressEvent.name,
        });
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveStartVerificationEvent.name,
        });
    });

    it('does not open shared address verification after cancelling sharing', async () => {
        mockShare.mockResolvedValue({ action: Share.dismissedAction });
        const { getByText } = await renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.shareButton')));

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
    });
});
