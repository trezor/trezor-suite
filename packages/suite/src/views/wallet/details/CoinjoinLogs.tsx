import { selectIsDebugModeActive } from '@suite/debug';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { Translation } from '@suite/intl';
import { Card } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const CoinjoinLogs = () => {
    const { desktopApi } = useServices(injectDesktopApi);
    const isDebug = useSelector(selectIsDebugModeActive);

    if (!isDebug) return null;

    return (
        <Card>
            <SectionItem>
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
            </SectionItem>
        </Card>
    );
};
