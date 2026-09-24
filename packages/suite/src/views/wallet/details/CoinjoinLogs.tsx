import { selectIsDebugModeActive } from '@suite/debug';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Card, Column } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const CoinjoinLogs = () => {
    const { desktopApi } = useServices(injectDesktopApi);
    const isDebug = useSelector(selectIsDebugModeActive);

    if (!isDebug) return null;

    return (
        <Card>
            <Column>
                <SectionItem
                    title={<Translation id="TR_COINJOIN_LOGS_TITLE" />}
                    description={<Translation id="TR_COINJOIN_LOGS_DESCRIPTION" />}
                    actions={
                        <SectionItem.Button
                            onClick={() => {
                                desktopApi.openUserDataDirectory('/logs');
                            }}
                        >
                            <Translation id="TR_COINJOIN_LOGS_ACTION" />
                        </SectionItem.Button>
                    }
                />
            </Column>
        </Card>
    );
};
