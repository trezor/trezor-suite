import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { Card, Column } from '@trezor/components';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
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
