import { DeviceModelInternal } from '@trezor/device-utils';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';

import { TextColumn, Translation } from 'src/components/suite';
import { HAS_MONOCHROME_SCREEN } from 'src/constants/suite/device';
import { deviceModelInformation } from 'src/utils/suite/homescreen';

type HomescreenSettingsTitle = {
    deviceModelInternal: DeviceModelInternal;
};

export const HomescreenSettingsTitle = ({ deviceModelInternal }: HomescreenSettingsTitle) => {
    const hasMonochromeScreen = HAS_MONOCHROME_SCREEN[deviceModelInternal];

    return hasMonochromeScreen ? (
        <TextColumn
            title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
            description={
                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW_128x64" />
            }
            buttonLink={HOMESCREEN_EDITOR_URL}
            buttonTitle={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />}
        />
    ) : (
        <TextColumn
            title={<Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />}
            description={
                <Translation
                    id="TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR"
                    values={{
                        width: deviceModelInformation[deviceModelInternal].width,
                        height: deviceModelInformation[deviceModelInternal].height,
                        maxSizeKb: Math.round(
                            deviceModelInformation[deviceModelInternal].maxImageSize / 1024,
                        ),
                    }}
                />
            }
        />
    );
};
