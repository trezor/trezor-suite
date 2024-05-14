import { Columns, Image, Rows, Text, Warning } from '@trezor/components';
import { useSelector } from '../../../../hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';

export const ConnectDevicePromo = () => {
    const selectedDevice = useSelector(selectDevice);
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    return (
        <Warning variant="warning" withIcon={false}>
            <Columns alignItems="center" justifyContent="space-between" gap={12} flex={1}>
                <Rows alignItems="start">
                    <Text typographyStyle="highlight" variant="warning">
                        Receive address can’t be verified
                    </Text>
                    <Text typographyStyle="titleSmall">
                        Verify on Trezor to confirm receive address. Continuing without confirming
                        isn’t recommended.
                    </Text>
                </Rows>

                <Image alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />
            </Columns>
        </Warning>
    );
};
