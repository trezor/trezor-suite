import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';

import { EarnProviderLogo } from './EarnProviderLogo';
import { type EarnProviderId } from './providerMetadata';

type PoweredByBadgeProps = {
    provider: EarnProviderId;
};

export function PoweredByBadge({ provider }: PoweredByBadgeProps) {
    return (
        <Row gap={8}>
            <Text intent="neutral" priority="secondary">
                <Translation id="TR_STAKE_PROVIDED_BY" />
            </Text>
            <EarnProviderLogo provider={provider} width={100} height={40} />
        </Row>
    );
}
