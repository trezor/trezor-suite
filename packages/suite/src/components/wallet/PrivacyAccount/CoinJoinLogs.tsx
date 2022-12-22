import React from 'react';
import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { ActionButton, ActionColumn, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { Card } from '@trezor/components';
import { useSelector } from '@suite-hooks/useSelector';
import { useAnchor } from '@suite-hooks/useAnchor';
import { CoinJoinLogsAnchor } from '@suite-constants/anchors';
import { anchorOutlineStyles } from '@suite-utils/anchor';

const SetupCard = styled(Card)<{ shouldHighlight?: boolean }>`
    position: relative;
    margin-top: 20px;
    overflow: hidden;
    flex-direction: row;

    ${anchorOutlineStyles}
`;

export const CoinJoinLogs = () => {
    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);
    const { anchorRef, shouldHighlight } = useAnchor(CoinJoinLogsAnchor);

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
