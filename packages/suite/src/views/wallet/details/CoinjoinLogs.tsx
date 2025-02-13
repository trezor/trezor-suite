import { Card, Column } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const CoinjoinLogs = () => {
    const isDebug = useSelector(selectIsDebugModeActive);

    if (!isDebug) return null;

    return (
        <Card>
            <Column>
                <TextColumn
                    title={<Translation id="TR_COINJOIN_LOGS_TITLE" />}
                    description={<Translation id="TR_COINJOIN_LOGS_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton
                        onClick={() => {
                            desktopApi.openUserDataDirectory('/logs');
                        }}
                    >
                        <Translation id="TR_COINJOIN_LOGS_ACTION" />
                    </ActionButton>
                </ActionColumn>
            </Column>
        </Card>
    );
};
