import { selectShowConnectLogs, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const TrezorConnectLogs = () => {
    const showConnectLogs = useSelector(selectShowConnectLogs);
    const dispatch = useDispatch();

    const logsDescription = `Show TrezorConnect logs in ${isDesktop() ? 'terminal' : 'console'}. ${isDesktop() ? 'Restart' : 'Refresh'} the application to apply changes.`;
    const toggleLogs = () =>
        dispatch(suiteSettingsActions.setDebugMode({ showConnectLogs: !showConnectLogs }));

    return (
        <SectionItem>
            <TextColumn title="TrezorConnect logs" description={logsDescription} />
            <ActionColumn>
                <Switch isChecked={showConnectLogs} onChange={toggleLogs} />
            </ActionColumn>
        </SectionItem>
    );
};
