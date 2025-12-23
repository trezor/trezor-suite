import { EventType } from '@suite/analytics';
import { Button, Column } from '@trezor/components';

import { toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

export const DeviceConnect = () => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();

    const handleConnect = () => {
        dispatch(toggleConnectionModal());
        legacyAnalytics.report({
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
