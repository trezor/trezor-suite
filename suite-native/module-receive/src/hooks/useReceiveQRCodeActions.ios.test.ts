// This is the iOS test selected through the `.ios` filename suffix.
import { Linking, Share } from 'react-native';
import { type ViewShotRef } from 'react-native-view-shot';

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { useReceiveQRCodeActions } from './useReceiveQRCodeActions.ios';

const mockShare = jest.spyOn(Share, 'share');
const mockOpenSettings = jest.spyOn(Linking, 'openSettings');
const mockCaptureRef = jest.fn();
const mockSetImageAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSaveToLibraryAsync = jest.fn();
const mockAnalyticsReport = jest.fn();
const mockShowToast = jest.fn();
const mockShowAlert = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mockAnalyticsReport),
};

jest.mock('react-native-view-shot', () => ({
    captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));

jest.mock('expo-clipboard', () => ({
    setImageAsync: (...args: unknown[]) => mockSetImageAsync(...args),
}));

jest.mock('expo-media-library/legacy', () => ({
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
    saveToLibraryAsync: (...args: unknown[]) => mockSaveToLibraryAsync(...args),
}));

jest.mock('@suite-native/toasts', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert }),
}));

describe('useReceiveQRCodeActions', () => {
    const qrCodeView = {} as ViewShotRef;

    const renderUseReceiveQRCodeActions = () =>
        renderHookWithBasicProvider(() => useReceiveQRCodeActions(), { services });

    beforeEach(() => {
        jest.clearAllMocks();
        mockShare.mockResolvedValue({ action: Share.sharedAction });
        mockOpenSettings.mockResolvedValue();
        mockCaptureRef.mockResolvedValue('/cache/trezor-receive-address-qr.png');
        mockSetImageAsync.mockResolvedValue(undefined);
        mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
        mockSaveToLibraryAsync.mockResolvedValue(undefined);
    });

    it('shares the QR code image', async () => {
        const { result } = renderUseReceiveQRCodeActions();
        result.current.qrCodeViewRef.current = qrCodeView;

        await act(() => result.current.handleShareQRCode());

        expect(mockCaptureRef).toHaveBeenCalledWith(qrCodeView, {
            fileName: 'trezor-receive-address-qr',
            format: 'png',
            result: 'tmpfile',
        });
        expect(mockShare).toHaveBeenCalledWith({
            url: 'file:///cache/trezor-receive-address-qr.png',
            title: getTranslation('moduleReceive.addressActions.shareQRCodeImage'),
        });
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveQRCodeActionEvent.name,
            payload: { action: 'share' },
        });
    });

    it('copies the QR code image', async () => {
        mockCaptureRef.mockResolvedValue('base64-image');
        const { result } = renderUseReceiveQRCodeActions();
        result.current.qrCodeViewRef.current = qrCodeView;

        await act(() => result.current.handleCopyQRCode());

        expect(mockCaptureRef).toHaveBeenCalledWith(qrCodeView, {
            format: 'png',
            result: 'base64',
        });
        expect(mockSetImageAsync).toHaveBeenCalledWith('base64-image');
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveQRCodeActionEvent.name,
            payload: { action: 'copy' },
        });
        expect(mockShowToast).toHaveBeenCalledWith({
            icon: 'check',
            intent: 'neutral',
            message: getTranslation('moduleReceive.addressActions.qrCodeCopiedToClipboard'),
        });
    });

    it('saves the QR code image', async () => {
        const { result } = renderUseReceiveQRCodeActions();
        result.current.qrCodeViewRef.current = qrCodeView;

        await act(() => result.current.handleSaveQRCode());

        expect(mockRequestPermissionsAsync).toHaveBeenCalledWith(true);
        expect(mockCaptureRef).toHaveBeenCalledWith(qrCodeView, {
            fileName: 'trezor-receive-address-qr',
            format: 'png',
            result: 'tmpfile',
        });
        expect(mockSaveToLibraryAsync).toHaveBeenCalledWith(
            'file:///cache/trezor-receive-address-qr.png',
        );
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.receiveQRCodeActionEvent.name,
            payload: { action: 'save' },
        });
        expect(mockShowToast).toHaveBeenCalledWith({
            icon: 'check',
            intent: 'neutral',
            message: getTranslation('moduleReceive.addressActions.qrCodeSavedToPhotos'),
        });
    });

    it('does not save the QR code image when media library permission is denied', async () => {
        mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
        const { result } = renderUseReceiveQRCodeActions();
        result.current.qrCodeViewRef.current = qrCodeView;

        await act(() => result.current.handleSaveQRCode());

        expect(mockRequestPermissionsAsync).toHaveBeenCalledWith(true);
        expect(mockCaptureRef).not.toHaveBeenCalled();
        expect(mockSaveToLibraryAsync).not.toHaveBeenCalled();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
        expect(mockShowToast).not.toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalledWith({
            title: getTranslation('moduleReceive.addressActions.photoPermissionDenied.title'),
            description: getTranslation(
                'moduleReceive.addressActions.photoPermissionDenied.description',
            ),
            pictogramVariant: 'warning',
            primaryButtonTitle: getTranslation(
                'moduleReceive.addressActions.photoPermissionDenied.openSettings',
            ),
            onPressPrimaryButton: expect.any(Function),
            secondaryButtonTitle: getTranslation('generic.buttons.cancel'),
        });

        const openSettingsAction = mockShowAlert.mock.calls[0]?.[0]?.onPressPrimaryButton;
        openSettingsAction?.();

        expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('shows an error when the QR code is not available', async () => {
        const { result } = renderUseReceiveQRCodeActions();

        await act(() => result.current.handleShareQRCode());

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith({
                title: 'Something went wrong',
                pictogramVariant: 'critical',
                primaryButtonTitle: 'Close',
            });
        });
        expect(mockShare).not.toHaveBeenCalled();
    });
});
