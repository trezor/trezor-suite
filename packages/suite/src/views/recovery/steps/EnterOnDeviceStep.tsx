import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';

type EnterOnDeviceStepProps = {
    deviceModelInternal: DeviceModelInternal;
};

export const EnterOnDeviceStep = ({ deviceModelInternal }: EnterOnDeviceStepProps) => (
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
