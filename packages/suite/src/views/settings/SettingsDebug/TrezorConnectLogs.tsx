import { Switch } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const TrezorConnectLogs = () => {
    const showConnectLogs = useSelector(state => state.suite.settings.debug.showConnectLogs);
    const dispatch = useDispatch();

    const logsDescription = `Show TrezorConnect logs in ${isDesktop() ? 'terminal' : 'console'}. ${isDesktop() ? 'Restart' : 'Refresh'} the application to apply changes.`;
    const toggleLogs = () => dispatch(setDebugMode({ showConnectLogs: !showConnectLogs }));

    return (
        <SectionItem>
            <TextColumn title="TrezorConnect logs" description={logsDescription} />
            <ActionColumn>
                <Switch isChecked={showConnectLogs} onChange={toggleLogs} />
            </ActionColumn>
        </SectionItem>
    );
};
