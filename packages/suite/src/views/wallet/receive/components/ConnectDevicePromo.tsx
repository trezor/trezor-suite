import { Column, Image, Row, Text, Warning } from '@trezor/components';
import { useSelector } from '../../../../hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { Translation } from 'src/components/suite';

export const ConnectDevicePromo = () => {
    const selectedDevice = useSelector(selectDevice);
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Warning variant="warning" withIcon={false}>
            <Row alignItems="center" justifyContent="space-between" gap={12} flex="1">
                <Column alignItems="start">
                    <Text typographyStyle="highlight" variant="warning">
                        <Translation id="TR_CONNECT_DEVICE_PROMO_TITLE" />
                    </Text>
                    <Text typographyStyle="titleSmall">
                        <Translation id="TR_CONNECT_DEVICE_PROMO_DESCRIPTION" />
                    </Text>
                </Column>

                <Image alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />
            </Row>
        </Warning>
    );
};
