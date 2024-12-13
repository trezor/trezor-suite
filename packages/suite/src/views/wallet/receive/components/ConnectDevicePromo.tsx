import { H4, Paragraph, Banner } from '@trezor/components';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';

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
            icon={
                selectedDeviceModelInternal === 'UNKNOWN'
                    ? undefined
                    : `trezor${selectedDeviceModelInternal}`
            }
            iconSize="extraLarge"
        >
            <H4>{title}</H4>
            <Paragraph>{description}</Paragraph>
        </Banner>
    );
};

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
