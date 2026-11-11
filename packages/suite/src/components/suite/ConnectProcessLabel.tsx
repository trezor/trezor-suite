import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { UNKNOWN_PROCESS, isIdentifiedProcess } from '@suite-common/connect-popup';
import { type ConnectProcessInfo } from '@suite-common/connect-popup/src/connectPopupTypes';
import { Badge, Icon, Row, Text, Tooltip } from '@trezor/components';
import { sanitizeName } from '@trezor/connect-common';
import { AppWindowIcon, WarningIcon } from '@trezor/icons';

const AppIcon = styled.img`
    width: 24px;
    height: 24px;
`;

interface ConnectProcessLabelProps {
    process: ConnectProcessInfo;
    'data-testid'?: string;
}

// `fullPath` is the path remembered permissions are keyed by, so it is shown on both badges and not
// only next to a warning: the executable on Linux and Windows, and on macOS the app bundle taken from
// the path the process reports for itself. A path that only repeats the name on the badge adds
// nothing to it.
const getPathTooltip = ({ fullPath }: ConnectProcessInfo, name: string) =>
    fullPath !== name ? fullPath : undefined;

export const ConnectProcessLabel = ({
    process,
    'data-testid': dataTest,
}: ConnectProcessLabelProps) => {
    // A grant remembered by an earlier version carries the name unsanitized, and an empty name
    // would leave the badge with no text.
    const name = sanitizeName(process.name) || process.fullPath || UNKNOWN_PROCESS.name;
    // The same predicate decides whether permissions can be remembered for the process, so a
    // process that cannot be told apart from others is warned about even when the lookup set no
    // warning, and its tooltip explains why instead of showing a path that identifies nothing.
    const isUnidentified = !isIdentifiedProcess(process);
    const tooltip = isUnidentified ? (
        <Translation id="TR_CONNECT_PROCESS_UNIDENTIFIED" />
    ) : (
        getPathTooltip(process, name)
    );

    if (process.warning || isUnidentified) {
        return (
            <Tooltip content={tooltip}>
                <Badge intent="warning" iconLeft={WarningIcon}>
                    <Text data-testid={dataTest}>{name}</Text>
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
                    <Text data-testid={dataTest}>{name}</Text>
                </Row>
            </Badge>
        </Tooltip>
    );
};
