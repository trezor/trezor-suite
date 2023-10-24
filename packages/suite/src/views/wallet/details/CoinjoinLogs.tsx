import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { Card } from '@trezor/components';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { CoinjoinLogsAnchor } from 'src/constants/suite/anchors';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';

const SetupCard = styled(Card)<{ shouldHighlight?: boolean }>`
    position: relative;
    overflow: hidden;
    flex-direction: row;

    ${anchorOutlineStyles}
`;

export const CoinjoinLogs = () => {
    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);
    const { anchorRef, shouldHighlight } = useAnchor(CoinjoinLogsAnchor);

    if (!showDebugMenu) return null;

    return (
        <SetupCard ref={anchorRef} shouldHighlight={shouldHighlight}>
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
        </SetupCard>
    );
};
