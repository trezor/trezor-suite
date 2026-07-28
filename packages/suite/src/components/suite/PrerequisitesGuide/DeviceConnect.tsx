import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { toggleConnectionModal } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Button, Column } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

export const DeviceConnect = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const handleConnect = () => {
        dispatch(toggleConnectionModal());
        analytics.report({
            type: events.deviceConnectionConnectButtonEvent.name,
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
