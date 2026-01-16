import { Translation } from '@suite/intl';
import { Button, Column } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch } from 'src/hooks/suite';

export const DeviceConnect = () => {
    const dispatch = useDispatch();

    const handleConnect = () => {
        dispatch(toggleConnectionModal());
        analytics.report({
            type: EventType.DeviceConnectionConnectButton,
            payload: {
                option: 'dashboard',
            },
        });
    };

    return (
        <Column alignItems="center" margin={{ bottom: 40 }}>
            <Button minWidth={240} size="large" onClick={handleConnect}>
                <Translation id="TR_CONNECT" />
            </Button>
        </Column>
    );
};
