import { Translation, useTranslation } from '@suite/intl';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { TextColumn } from '@trezor/product-components';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { HAS_MONOCHROME_SCREEN } from 'src/constants/suite/device';
import { deviceModelInformation } from 'src/utils/suite/homescreen';

type HomescreenSettingsTitle = {
    deviceModelInternal: DeviceModelInternal;
};

export const HomescreenSettingsTitle = ({ deviceModelInternal }: HomescreenSettingsTitle) => {
    const hasMonochromeScreen = HAS_MONOCHROME_SCREEN[deviceModelInternal];
    const { translationString } = useTranslation();

    const baseDescription = translationString('TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS', {
        width: deviceModelInformation[deviceModelInternal].width,
        height: deviceModelInformation[deviceModelInternal].height,
    });

    return hasMonochromeScreen ? (
        <TextColumn
            title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
            description={
                baseDescription +
                ' ' +
                translationString('TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW')
            }
            learnMoreButton={
                <LearnMoreButton url={HOMESCREEN_EDITOR_URL}>
                    <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />
                </LearnMoreButton>
            }
        />
    ) : (
        <TextColumn
            title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
            description={baseDescription}
        />
    );
};
