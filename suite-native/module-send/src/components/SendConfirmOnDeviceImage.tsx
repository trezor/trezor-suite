import { ConfirmOnTrezorImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

export const SendConfirmOnDeviceImage = () => {
    return (
        <ConfirmOnTrezorImage
            bottomSheetText={<Translation id="moduleSend.review.confirmOnDeviceMessage" />}
        />
    );
};
