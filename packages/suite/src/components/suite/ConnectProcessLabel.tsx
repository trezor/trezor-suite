import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { isIdentifiedProcess } from '@suite-common/connect-popup';
import { type ConnectProcessInfo } from '@suite-common/connect-popup/src/connectPopupTypes';
import { Badge, Icon, Row, Text, Tooltip } from '@trezor/components';
import { AppWindowIcon, WarningIcon } from '@trezor/icons';

const AppIcon = styled.img`
    width: 24px;
    height: 24px;
`;

interface ConnectProcessLabelProps {
    process: ConnectProcessInfo;
    'data-testid'?: string;
}

export const ConnectProcessLabel = ({
    process,
    'data-testid': dataTest,
}: ConnectProcessLabelProps) => {
    // A path that identifies nothing, or only repeats the name on the badge, tells the user
    // nothing about who is calling — the same predicate decides whether permissions can be
    // remembered, so such a process is warned about even when the lookup set no warning.
    const isUnverified = !isIdentifiedProcess(process) || process.fullPath === process.name;

    if (process.warning || isUnverified) {
        const tooltip = isUnverified ? (
            <Translation id="TR_CONNECT_PROCESS_UNVERIFIED" />
        ) : (
            process.fullPath
        );

        return (
            <Tooltip content={tooltip}>
                <Badge intent="warning" iconLeft={WarningIcon}>
                    <Text data-testid={dataTest}>{process.name}</Text>
                </Badge>
            </Tooltip>
        );
    }

    return (
        <Badge intent="neutral">
            <Row gap={8}>
                {process.icon ? (
                    <AppIcon src={process.icon} alt="Process icon" />
                ) : (
                    <Icon as={AppWindowIcon} intent="neutral" priority="secondary" />
                )}
                <Text data-testid={dataTest}>{process.name}</Text>
            </Row>
        </Badge>
    );
};
