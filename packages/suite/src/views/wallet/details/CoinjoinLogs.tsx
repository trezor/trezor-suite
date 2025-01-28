import styled from 'styled-components';

import { Card } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { CoinjoinLogsAnchor } from 'src/constants/suite/anchors';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';

// eslint-disable-next-line local-rules/no-override-ds-component
const SetupCard = styled(Card)<{ $shouldHighlight?: boolean }>`
    position: relative;
    overflow: hidden;
    flex-direction: row;

    ${anchorOutlineStyles}
`;

export const CoinjoinLogs = () => {
    const isDebug = useSelector(selectIsDebugModeActive);

    const { anchorRef, shouldHighlight } = useAnchor(CoinjoinLogsAnchor);

    if (!isDebug) return null;

    return (
        <SetupCard ref={anchorRef} $shouldHighlight={shouldHighlight}>
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
