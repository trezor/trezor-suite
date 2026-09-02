// This is the iOS implementation selected by Metro through the `.ios` filename suffix.
import { useCallback, useRef } from 'react';
import { Linking, Share } from 'react-native';
import { type ViewShotRef, captureRef } from 'react-native-view-shot';

import * as Clipboard from 'expo-clipboard';

import { useServices } from '@suite-common/dependency-injection';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import { saveQRCodeImageToPhotos } from '../utils/saveQRCodeImageToPhotos.ios';

const getShareableFileURI = (uri: string): string =>
    uri.startsWith('file://') ? uri : `file://${uri}`;

const captureQRCodeImageURI = (qrCodeView: ViewShotRef): Promise<string> =>
    captureRef(qrCodeView, {
        fileName: 'trezor-receive-address-qr',
        format: 'png',
        result: 'tmpfile',
    });

const captureQRCodeImageBase64 = (qrCodeView: ViewShotRef): Promise<string> =>
    captureRef(qrCodeView, {
        format: 'png',
        result: 'base64',
    });

export const useReceiveQRCodeActions = () => {
    const qrCodeViewRef = useRef<ViewShotRef>(null);
    const { analytics } = useServices(selectNativeAnalyticsDep);
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

            const { action } = await Share.share({
                url: getShareableFileURI(qrCodeImageURI),
                title: translate('moduleReceive.addressActions.shareQRCodeImage'),
            });

            if (action === Share.dismissedAction) {
                return;
            }

            analytics.report({
                type: events.receiveQRCodeActionEvent.name,
                payload: { action: 'share' },
            });
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
            const result = await saveQRCodeImageToPhotos(async () =>
                getShareableFileURI(await captureQRCodeImageURI(qrCodeView)),
            );

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
