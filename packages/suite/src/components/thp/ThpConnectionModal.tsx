import { TrezorDevice } from '@suite-common/suite-types';
import { deviceActions } from '@suite-common/wallet-core';
import { Card, Column, ElevationDown, Switch, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

import { useDispatch } from '../../hooks/suite';
import { ConfirmActionModal } from '../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type PinInvalidModalProps = {
    isAutoConnectAvailable?: boolean;
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ isAutoConnectAvailable, device }: PinInvalidModalProps) => {
    const dispatch = useDispatch();

    const handleOnChange = () => {
        dispatch(deviceActions.setDeviceThpAutoConnect({ thpAutoConnect: !device.thpAutoConnect }));
    };

    return (
        <ConfirmActionModal device={device} title="TR_THP_SECURELY_CONNECT_WITH_TREZOR">
            {isAutoConnectAvailable && (
                <Column flex="1" alignItems="center" justifyContent="center" gap={spacings.sm}>
                    <ElevationDown>
                        <ElevationDown>
                            <Card width="auto">
                                <Switch
                                    labelPosition="start"
                                    isChecked={device.thpAutoConnect === true}
                                    onChange={handleOnChange}
                                    label={<Translation id="TR_DO_NOT_SHOW_AGAIN" />}
                                />
                            </Card>
                        </ElevationDown>
                    </ElevationDown>
                    <Text variant="tertiary">
                        <Translation id="TR_THP_CONFIRM_ON_NEXT_STEP" />
                    </Text>
                </Column>
            )}
        </ConfirmActionModal>
    );
};
