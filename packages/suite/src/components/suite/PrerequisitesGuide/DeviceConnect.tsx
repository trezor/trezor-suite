import { events, injectDesktopAnalytics } from '@suite/analytics';
import { toggleConnectionModal } from '@suite/device';
import { Translation } from '@suite/intl';
import { Button, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const DeviceConnect = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

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
