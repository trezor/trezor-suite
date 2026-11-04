import { type JSX } from 'react';

import { Translation } from '@suite/intl';
import { selectDeviceInternalModel } from '@suite-common/device';
import { Banner } from '@trezor/components';
import { DEFAULT_FLAGSHIP_MODEL } from '@trezor/device';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

type ConnectDevicePromoProps = {
    title: JSX.Element | string;
    description: JSX.Element | string;
};

const ConnectDevicePromo = ({ title, description }: ConnectDevicePromoProps) => {
    const deviceModelInternal = useSelector(selectDeviceInternalModel);

    return (
        <Banner
            intent="warning"
            data-testid="@warning/trezorNotConnected"
            icon={mapTrezorModelToIcon[deviceModelInternal || DEFAULT_FLAGSHIP_MODEL]}
            title={title}
            description={description}
        />
    );
};

export const ConnectDeviceGenericPromo = () => (
    <ConnectDevicePromo
        title={<Translation id="TR_CONNECT_DEVICE_GENERIC_PROMO_TITLE" />}
        description={<Translation id="TR_CONNECT_DEVICE_GENERIC_PROMO_DESCRIPTION" />}
    />
);
