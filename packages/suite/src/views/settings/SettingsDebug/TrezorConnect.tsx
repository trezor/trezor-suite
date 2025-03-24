import { Switch } from '@trezor/components';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const TrezorConnect = () => {
    const showConnectLogs = useSelector(state => state.suite.settings.debug.showConnectLogs);
    const dispatch = useDispatch();

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="TrezorConnect logs"
                    description="Toggle to enable/disable TrezorConnect logs in console. You need to restart the application to apply changes."
                />
                <ActionColumn>
                    <Switch
                        isChecked={showConnectLogs}
                        onChange={() => {
                            dispatch(setDebugMode({ showConnectLogs: !showConnectLogs }));
                        }}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
