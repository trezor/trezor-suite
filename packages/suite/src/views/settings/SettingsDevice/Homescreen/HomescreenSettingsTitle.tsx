import { LearnMoreButton } from '@suite/external-links';
import { Translation, useTranslation } from '@suite/intl';
import { Column, Paragraph } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { HOMESCREEN_EDITOR_URL } from '@trezor/urls';

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

    return (
        <Column flex="1" gap={12} alignItems="flex-start">
            <Paragraph typographyStyle="body-md">
                <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_TITLE" />
            </Paragraph>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                {hasMonochromeScreen
                    ? baseDescription +
                      ' ' +
                      translationString('TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW')
                    : baseDescription}
            </Paragraph>
            {hasMonochromeScreen && (
                <LearnMoreButton url={HOMESCREEN_EDITOR_URL}>
                    <Translation id="TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR" />
                </LearnMoreButton>
            )}
        </Column>
    );
};
