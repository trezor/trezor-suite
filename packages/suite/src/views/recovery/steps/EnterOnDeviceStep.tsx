import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';
export const EnterOnDeviceStep = ({
    deviceModelInternal,
}: {
    deviceModelInternal: DeviceModelInternal;
}) => (
    <Banner
        intent="info"
        icon={mapTrezorModelToIcon[deviceModelInternal]}
        margin={{ top: 8 }}
        description={
            <span data-testid="@recovery/paragraph">
                <Translation id="TR_ENTER_SEED_WORDS_ON_DEVICE" />
            </span>
        }
    />
);
