import styled from 'styled-components';

import { Translation } from '@suite/intl';
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
    // `name` is what the process calls itself, `fullPath` is where it actually runs from, so the
    // path is shown on both branches and not only next to a warning. Without a path, the tooltip
    // says so, and names the executable the lookup did observe when there is one: it is the only
    // thing the prompt knows about a caller whose badge shows its own declared name.
    const missingPath = process.observedName ? (
        <Translation id="TR_CONNECT_PROCESS_RUNS_AS" values={{ name: process.observedName }} />
    ) : (
        <Translation id="TR_CONNECT_PROCESS_PATH_UNKNOWN" />
    );
    const tooltip = process.fullPath || missingPath;

    if (process.warning) {
        return (
            <Tooltip content={tooltip}>
                <Badge intent="warning" iconLeft={WarningIcon}>
                    <Text data-testid={dataTest}>{process.name}</Text>
                </Badge>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={tooltip}>
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
        </Tooltip>
    );
};
