import { prepareNativeStyle } from '@trezor/styles-native';
import type { NativeSpacing } from '@trezor/theme';

export const RECEIVE_QR_CODE_PADDING = 'sp16' satisfies NativeSpacing;

export const receiveQRCodeCardStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
    overflow: 'hidden',
}));

export const receiveQRCodeContainerStyle = prepareNativeStyle<{
    qrCodeSize: number;
    paddingHorizontal: number;
    paddingVertical: number;
}>((utils, { qrCodeSize, paddingHorizontal, paddingVertical }) => ({
    width: qrCodeSize + paddingHorizontal,
    height: qrCodeSize + paddingVertical,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.surfaceFillRaised,
}));
