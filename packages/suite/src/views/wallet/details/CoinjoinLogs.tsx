import { selectIsDebugModeActive } from '@suite/debug';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Card, Column } from '@trezor/components';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const CoinjoinLogs = () => {
    const { desktopApi } = useServices(injectDesktopApi);
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
