import styled from 'styled-components';

import { selectRawActionsLogsEntries } from '@suite-common/logger';
import { Card, Column, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

// Dev debug panel: mirrors recent Totem / Monero-scan log entries straight into the Totem tab, so a
// remote-backend flow can be debugged live without digging through the full application log export.
const isRelevant = (type: unknown) =>
    type === 'monero-scan' || (typeof type === 'string' && type.startsWith('totem'));

const LogArea = styled.pre`
    margin: 0;
    max-height: 260px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 11px;
    line-height: 1.5;
`;

export const TotemDebugLog = () => {
    const entries = useSelector(selectRawActionsLogsEntries);
    // Newest first so the latest event is visible without scrolling.
    const relevant = entries
        .filter(entry => isRelevant(entry.type))
        .slice(-50)
        .reverse();

    const text = relevant
        .map(
            entry =>
                `${entry.datetime.slice(17, 25)}  ${entry.type}  ${JSON.stringify(entry.payload)}`,
        )
        .join('\n');

    return (
        <Card>
            <Column gap={spacings.xs} alignItems="stretch">
                <Text typographyStyle="body-md-strong">Debug log (Totem / scan)</Text>
                <LogArea>{text || 'No Totem / scan events yet.'}</LogArea>
            </Column>
        </Card>
    );
};
