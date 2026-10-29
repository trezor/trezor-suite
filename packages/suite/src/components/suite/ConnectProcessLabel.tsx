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
    if (process.warning) {
        // A path that identifies nothing, or only repeats the name on the badge, would make a
        // tooltip that says nothing, so it explains what the warning means instead.
        const tooltip =
            isIdentifiedProcess(process) && process.fullPath !== process.name ? (
                process.fullPath
            ) : (
                <Translation id="TR_CONNECT_PROCESS_UNVERIFIED" />
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
