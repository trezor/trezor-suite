import { useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { type ViewShotRef, captureRef } from 'react-native-view-shot';

import * as Clipboard from 'expo-clipboard';

import { useAlert } from '@suite-native/alerts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

import { saveQRCodeImageToPhotos } from '../utils/saveQRCodeImageToPhotos';
// Metro resolves this to `shareQRCodeImage.android.ts` on Android. iOS, TypeScript and Jest use
// the unsuffixed default.
import { shareQRCodeImage } from '../utils/shareQRCodeImage';

// The capture resolves to a bare path on iOS and to a `file://` URI on Android.
const getShareableFileURI = (uri: string): string =>
    uri.startsWith('file://') ? uri : `file://${uri}`;

const captureQRCodeImageURI = async (qrCodeView: ViewShotRef): Promise<string> =>
    getShareableFileURI(
        await captureRef(qrCodeView, {
            fileName: 'trezor-receive-address-qr',
            format: 'png',
            result: 'tmpfile',
        }),
    );

const captureQRCodeImageBase64 = (qrCodeView: ViewShotRef): Promise<string> =>
    captureRef(qrCodeView, {
        format: 'png',
        result: 'base64',
    });

export const useReceiveQRCodeActions = () => {
    const qrCodeViewRef = useRef<ViewShotRef>(null);
    const { analytics } = useServices(injectNativeAnalytics);
    const { translate } = useTranslate();
    const { showToast } = useToast();
    const { showAlert } = useAlert();

    const showGenericErrorAlert = useCallback(() => {
        showAlert({
            title: translate('generic.unknownError'),
            pictogramVariant: 'critical',
            primaryButtonTitle: translate('generic.buttons.close'),
        });
    }, [showAlert, translate]);

    const handleShareQRCode = useCallback(async () => {
        if (qrCodeViewRef.current === null) {
            showGenericErrorAlert();

            return;
        }

        try {
            const qrCodeImageURI = await captureQRCodeImageURI(qrCodeViewRef.current);
            const shareResult = await shareQRCodeImage({
                imageURI: qrCodeImageURI,
                title: translate('moduleReceive.addressActions.shareQRCodeImage'),
            });

            switch (shareResult) {
                case 'shared':
                case 'unknown':
                    // Android reports `unknown` for both a completed and a dismissed share, so
                    // every attempt is counted there.
                    analytics.report({
                        type: events.receiveQRCodeActionEvent.name,
                        payload: { action: 'share' },
                    });

                    return;
                case 'dismissed':
                    return;
                default:
                    return exhaustive(shareResult);
            }
        } catch {
            showGenericErrorAlert();
        }
    }, [analytics, showGenericErrorAlert, translate]);

    const handleCopyQRCode = useCallback(async () => {
        if (qrCodeViewRef.current === null) {
            showGenericErrorAlert();

            return;
        }

        try {
            const qrCodeImageBase64 = await captureQRCodeImageBase64(qrCodeViewRef.current);
            await Clipboard.setImageAsync(qrCodeImageBase64);
            analytics.report({
                type: events.receiveQRCodeActionEvent.name,
                payload: { action: 'copy' },
            });
            showToast({
                icon: 'check',
                intent: 'neutral',
                message: translate('moduleReceive.addressActions.qrCodeCopiedToClipboard'),
            });
        } catch {
            showGenericErrorAlert();
        }
    }, [analytics, showGenericErrorAlert, showToast, translate]);

    const handleSaveQRCode = useCallback(async () => {
        const qrCodeView = qrCodeViewRef.current;

        if (qrCodeView === null) {
            showGenericErrorAlert();

            return;
        }

        try {
            const result = await saveQRCodeImageToPhotos(() => captureQRCodeImageURI(qrCodeView));

            switch (result) {
                case 'saved':
                    analytics.report({
                        type: events.receiveQRCodeActionEvent.name,
                        payload: { action: 'save' },
                    });
                    showToast({
                        icon: 'check',
                        intent: 'neutral',
                        message: translate('moduleReceive.addressActions.qrCodeSavedToPhotos'),
                    });

                    return;
                case 'permissionDenied':
                    showAlert({
                        title: translate(
                            'moduleReceive.addressActions.photoPermissionDenied.title',
                        ),
                        description: translate(
                            'moduleReceive.addressActions.photoPermissionDenied.description',
                        ),
                        pictogramVariant: 'warning',
                        primaryButtonTitle: translate(
                            'moduleReceive.addressActions.photoPermissionDenied.openSettings',
                        ),
                        onPressPrimaryButton: () => void Linking.openSettings(),
                        secondaryButtonTitle: translate('generic.buttons.cancel'),
                    });

                    return;
                default:
                    return exhaustive(result);
            }
        } catch {
            showGenericErrorAlert();
        }
    }, [analytics, showAlert, showGenericErrorAlert, showToast, translate]);

    return {
        qrCodeViewRef,
        handleCopyQRCode,
        handleSaveQRCode,
        handleShareQRCode,
    };
};
