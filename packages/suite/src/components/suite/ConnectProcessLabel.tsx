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
    // The same predicate decides whether permissions can be remembered for the process, so a
    // process that cannot be told apart from others is warned about even when the lookup set no
    // warning, and its tooltip explains why instead of showing a path that identifies nothing.
    const isUnidentified = !isIdentifiedProcess(process);

    if (process.warning || isUnidentified) {
        const tooltip = isUnidentified ? (
            <Translation id="TR_CONNECT_PROCESS_UNIDENTIFIED" />
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
