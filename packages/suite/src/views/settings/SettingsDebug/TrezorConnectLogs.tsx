import { selectShowConnectLogs, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const TrezorConnectLogs = () => {
    const showConnectLogs = useSelector(selectShowConnectLogs);
    const { dispatch } = useServices(injectDispatch);

    const logsDescription = `Show TrezorConnect logs in ${isDesktop() ? 'terminal' : 'console'}. ${isDesktop() ? 'Restart' : 'Refresh'} the application to apply changes.`;
    const toggleLogs = () =>
        dispatch(suiteSettingsActions.setDebugMode({ showConnectLogs: !showConnectLogs }));

    return (
        <SectionItem
            title="TrezorConnect logs"
            description={logsDescription}
            actions={<Switch isChecked={showConnectLogs} onChange={toggleLogs} />}
        />
    );
};
