import { Share } from 'react-native';

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';
import { act, renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { useReceiveAddressSharing } from './useReceiveAddressSharing';

const mockOpenSharedAddressBottomSheet = jest.fn();
const mockCloseSharedAddressBottomSheet = jest.fn();
const mockVerifyAddress = jest.fn();
const mockShare = jest.spyOn(Share, 'share');
const mockUseBottomSheetModal = jest.fn();
const mockAnalyticsReport = jest.fn();
const mockShowAlert = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mockAnalyticsReport),
};

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => mockUseBottomSheetModal(),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert }),
}));

describe('useReceiveAddressSharing', () => {
    const address = 'bc1qreceiveaddress';

    const renderUseReceiveAddressSharing = () =>
        renderHookWithBasicProvider(
            () =>
                useReceiveAddressSharing({
                    address,
                    onVerifyAddress: mockVerifyAddress,
                }),
            { services },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockShare.mockResolvedValue({ action: Share.sharedAction });
        mockUseBottomSheetModal.mockReturnValue({
            bottomSheetRef: { current: null },
            openModal: mockOpenSharedAddressBottomSheet,
            closeModal: mockCloseSharedAddressBottomSheet,
        });
    });

    it('opens shared address verification after sharing the address', async () => {
        const { result } = renderUseReceiveAddressSharing();

        await act(() => result.current.handleShareAddress());

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveShareAddressEvent.name,
        });
    });

    it('does not open shared address verification after cancelling sharing', async () => {
        mockShare.mockResolvedValue({ action: Share.dismissedAction });
        const { result } = renderUseReceiveAddressSharing();

        await act(() => result.current.handleShareAddress());

        expect(mockShare).toHaveBeenCalledWith({ message: address });
        expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
    });

    it('starts shared address verification from the bottom sheet', () => {
        const { result } = renderUseReceiveAddressSharing();

        act(() => result.current.handleVerifySharedAddress());

        expect(mockCloseSharedAddressBottomSheet).toHaveBeenCalledTimes(1);
        expect(mockVerifyAddress).toHaveBeenCalledWith(ReceiveAddressVerificationSource.Shared);
    });

    it('shows an error when sharing the address fails', async () => {
        mockShare.mockRejectedValue(new Error('Sharing failed'));
        const { result } = renderUseReceiveAddressSharing();

        await act(() => result.current.handleShareAddress());

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith({
                title: 'Something went wrong',
                pictogramVariant: 'critical',
                primaryButtonTitle: 'Close',
            });
        });
        expect(mockOpenSharedAddressBottomSheet).not.toHaveBeenCalled();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
    });
});
