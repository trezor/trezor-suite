import { Translation, type TranslationKey } from '@suite/intl';
import { Icon, Row, Text } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

type EarnProviderInfoBadgeProps = {
    messageId: TranslationKey;
};

export function EarnProviderInfoBadge({ messageId }: EarnProviderInfoBadgeProps) {
    return (
        <Row gap={4}>
            <Icon as={InfoIcon} size={16} intent="neutral" priority="secondary" />
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={messageId} />
            </Text>
        </Row>
    );
}
