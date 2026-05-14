import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { Card, Column } from '@trezor/components';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useSelector } from 'src/hooks/suite/useSelector';

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
