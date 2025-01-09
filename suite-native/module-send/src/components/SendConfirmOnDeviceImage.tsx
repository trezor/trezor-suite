import { ConfirmOnTrezorImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

export const SendConfirmOnDeviceImage = () => (
    <ConfirmOnTrezorImage
        bottomSheetText={<Translation id="moduleSend.review.confirmOnDeviceMessage" />}
    />
);
