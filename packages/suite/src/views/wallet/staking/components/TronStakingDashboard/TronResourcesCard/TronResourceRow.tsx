import { Translation, type TranslationKey } from '@suite/intl';
import { Box, ProgressBar, Row, Text, TextButton, Tooltip } from '@trezor/components';

interface TronResourceRowProps {
    label: TranslationKey;
    tooltip: TranslationKey;
    available: number;
    total: number;
    onClick: () => void;
}

export const TronResourceRow = ({
    label,
    tooltip,
    available,
    total,
    onClick,
}: TronResourceRowProps) => (
    <Row justifyContent="space-between" alignItems="center">
        <Tooltip hasIcon content={<Translation id={tooltip} />}>
            <Text typographyStyle="body-sm">
                <Translation id={label} />
            </Text>
        </Tooltip>
        <Row gap={12} alignItems="center">
            <TextButton
                size="small"
                intent="neutral"
                priority="primary"
                isUnderlined
                onClick={onClick}
            >
                {available}/{total}
            </TextButton>
            <Box width={120}>
                <ProgressBar value={available} max={Math.max(total, 1)} />
            </Box>
        </Row>
    </Row>
);
