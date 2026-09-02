import { prepareNativeStyle } from '@trezor/styles-native';
import type { NativeSpacing } from '@trezor/theme';

export const RECEIVE_QR_CODE_PADDING = 'sp16' satisfies NativeSpacing;

export const receiveQRCodeCardStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

export const receiveQRCodeContainerStyle = prepareNativeStyle<{
    qrCodeSize: number;
    paddingHorizontal: number;
    paddingVertical: number;
}>((utils, { qrCodeSize, paddingHorizontal, paddingVertical }) => ({
    width: qrCodeSize + paddingHorizontal,
    height: qrCodeSize + paddingVertical,
    backgroundColor: utils.colors.surfaceFillRaised,
}));
