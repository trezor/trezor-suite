import styled from 'styled-components';

import { ConnectProcessInfo } from '@suite-common/connect-popup/src/connectPopupTypes';
import { Badge, Icon, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
        return (
            <Tooltip content={process.fullPath}>
                <Badge variant="warning" icon="warning">
                    <Text data-testid={dataTest}>{process.name}</Text>
                </Badge>
            </Tooltip>
        );
    }

    return (
        <Badge variant="tertiary">
            <Row gap={spacings.xs}>
                {process.icon ? (
                    <AppIcon src={process.icon} alt="Process icon" />
                ) : (
                    <Icon name="appWindow" variant="tertiary" />
                )}
                <Text data-testid={dataTest}>{process.name}</Text>
            </Row>
        </Badge>
    );
};
