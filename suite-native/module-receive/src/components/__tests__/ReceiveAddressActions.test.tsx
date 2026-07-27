import { Share } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { getTranslation } from '@suite-native/intl';
import { ReceiveAddressVerificationSource, ReceiveStackRoutes } from '@suite-native/navigation';
import { renderWithBasicProvider, userEvent, waitFor } from '@suite-native/test-utils';

import { ReceiveAddressActions } from '../ReceiveAddressActions';

const mockCopyToClipboard = jest.fn();
const mockOpenCopiedAddressBottomSheet = jest.fn();
const mockCloseCopiedAddressBottomSheet = jest.fn();
const mockOpenSharedAddressBottomSheet = jest.fn();
const mockCloseSharedAddressBottomSheet = jest.fn();
const mockVerifyAddress = jest.fn();
const mockShare = jest.spyOn(Share, 'share');
const mockUseBottomSheetModal = jest.fn();
const mockNavigate = jest.fn();

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
    const address = 'bc1qreceiveaddress';
    const mockUseNavigation = jest.mocked(useNavigation);

    const renderActions = () =>
        renderWithBasicProvider(
            <ReceiveAddressActions address={address} onVerifyAddress={mockVerifyAddress} />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockCopyToClipboard.mockResolvedValue(undefined);
        mockVerifyAddress.mockResolvedValue(undefined);
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
        const { getByText } = renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.copyButton')));

        await waitFor(() => {
            expect(mockCopyToClipboard).toHaveBeenCalledWith(
                address,
                getTranslation('qrCode.addressCopied'),
            );
            expect(mockOpenCopiedAddressBottomSheet).toHaveBeenCalledTimes(1);
            expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
        });
    });

    it('closes the sheet and starts address verification', async () => {
        const { getByTestId } = renderActions();

        await userEvent.press(getByTestId('@receive/address-verification/pasted/verify-button'));

        expect(mockCloseCopiedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            source: ReceiveAddressVerificationSource.Pasted,
        });
        expect(mockVerifyAddress).toHaveBeenCalledWith();
    });

    it('starts address verification directly', async () => {
        const { getByText } = renderActions();

        await userEvent.press(getByText(getTranslation('moduleReceive.addressActions.verify')));

        expect(mockCloseCopiedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockCloseSharedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            source: ReceiveAddressVerificationSource.Pasted,
        });
        expect(mockVerifyAddress).toHaveBeenCalledWith();
    });

    it('opens shared address verification after sharing', async () => {
        const { getByText, getByTestId } = renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.shareButton')));
        await userEvent.press(getByTestId('@receive/address-verification/shared/verify-button'));

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockCloseSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(ReceiveStackRoutes.ReceiveAddressVerification, {
            source: ReceiveAddressVerificationSource.Shared,
        });
        expect(mockVerifyAddress).toHaveBeenCalledWith();
    });

    it('does not open shared address verification after cancelling sharing', async () => {
        mockShare.mockResolvedValue({ action: Share.dismissedAction });
        const { getByText } = renderActions();

        await userEvent.press(getByText(getTranslation('qrCode.shareButton')));

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
    });
});
