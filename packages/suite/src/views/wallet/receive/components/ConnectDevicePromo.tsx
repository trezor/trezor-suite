import { Column, Image, Row, Text, Warning } from '@trezor/components';
import { useSelector } from '../../../../hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { Translation } from 'src/components/suite';

type ConnectDevicePromoProps = {
    title: JSX.Element | string;
    description: JSX.Element | string;
};

const ConnectDevicePromo = ({ title, description }: ConnectDevicePromoProps) => {
    const selectedDevice = useSelector(selectDevice);
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Warning variant="warning" data-testid="@warning/trezorNotConnected">
            <Row alignItems="center" justifyContent="space-between" gap={12} flex="1">
                <Column alignItems="start">
                    <Text typographyStyle="highlight" variant="warning">
                        {title}
                    </Text>
                    <Text typographyStyle="titleSmall">{description}</Text>
                </Column>

                <Image alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />
            </Row>
        </Warning>
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
