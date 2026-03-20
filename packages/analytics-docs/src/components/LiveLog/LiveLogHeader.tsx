import { Badge, Box, H3, IconButton, Row, Text, Tooltip } from '@trezor/components';

type LiveLogHeaderProps = {
    connected: boolean;
    hasEvents: boolean;
    logServerBaseUrl: string;
    onClear: () => void;
    onSettingsClick: () => void;
};

export const LiveLogHeader = ({
    connected,
    hasEvents,
    logServerBaseUrl,
    onClear,
    onSettingsClick,
}: LiveLogHeaderProps) => (
    <Box padding={{ horizontal: 20, top: 20, bottom: 8 }}>
        <Row justifyContent="space-between" alignItems="center" gap={8}>
            <H3 margin={{ bottom: 0 }}>Live log</H3>
            <Row gap={8}>
                {hasEvents && (
                    <Tooltip content="Clear log">
                        <IconButton
                            size="small"
                            priority="secondary"
                            intent="critical"
                            onClick={onClear}
                            icon="prohibit"
                        />
                    </Tooltip>
                )}
                <Tooltip content="Settings">
                    <IconButton
                        icon="gear"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={onSettingsClick}
                    />
                </Tooltip>
            </Row>
        </Row>
        <Box margin={{ bottom: 8 }}>
            <Badge size="small" intent={connected ? 'brand' : 'warning'}>
                {connected ? 'Connected' : 'Reconnecting…'}
            </Badge>
        </Box>
        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
            In Suite, set Custom Analytics URL (Settings → Debug) to{' '}
            <Text isMonospaced typographyStyle="inherit">
                {`${logServerBaseUrl.replace(/\/+$/, '')}/log`}
            </Text>
        </Text>
    </Box>
);
