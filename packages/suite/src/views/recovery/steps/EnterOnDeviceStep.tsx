import { Banner, Paragraph } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

export const EnterOnDeviceStep = ({
    deviceModelInternal,
}: {
    deviceModelInternal: DeviceModelInternal;
}) => (
    <Banner
        intent="info"
        icon={mapTrezorModelToIcon[deviceModelInternal]}
        margin={{ top: spacings.xs }}
    >
        <Paragraph>
            <Translation id="TR_ENTER_SEED_WORDS_ON_DEVICE" />
        </Paragraph>
    </Banner>
);
