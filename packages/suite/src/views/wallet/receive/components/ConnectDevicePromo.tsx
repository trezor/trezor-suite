import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Banner, H4, Paragraph } from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { Translation } from 'src/components/suite';

import { useSelector } from '../../../../hooks/suite';

type ConnectDevicePromoProps = {
    title: JSX.Element | string;
    description: JSX.Element | string;
};

const ConnectDevicePromo = ({ title, description }: ConnectDevicePromoProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Banner
            variant="warning"
            data-testid="@warning/trezorNotConnected"
            icon={mapTrezorModelToIcon[selectedDeviceModelInternal]}
            iconSize="extraLarge"
        >
            <H4>{title}</H4>
            <Paragraph>{description}</Paragraph>
        </Banner>
    );
};

export const ConnectDeviceGenericPromo = () => (
    <ConnectDevicePromo
        title={<Translation id="TR_CONNECT_DEVICE_GENERIC_PROMO_TITLE" />}
        description={<Translation id="TR_CONNECT_DEVICE_GENERIC_PROMO_DESCRIPTION" />}
    />
);

export const ConnectDeviceReceivePromo = () => (
    <ConnectDevicePromo
        title={<Translation id="TR_CONNECT_DEVICE_RECEIVE_PROMO_TITLE" />}
        description={<Translation id="TR_CONNECT_DEVICE_RECEIVE_PROMO_DESCRIPTION" />}
    />
);

export const ConnectDeviceSendPromo = () => (
    <ConnectDevicePromo
        title={<Translation id="TR_CONNECT_DEVICE_SEND_PROMO_TITLE" />}
        description={<Translation id="TR_CONNECT_DEVICE_SEND_PROMO_DESCRIPTION" />}
    />
);
