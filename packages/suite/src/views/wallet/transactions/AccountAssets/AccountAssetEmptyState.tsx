import { Translation } from '@suite/intl';
import { Card, Column, Text } from '@trezor/components';

export const AccountAssetEmptyState = () => (
    <Card data-testid="@wallet/account-assets/empty">
        <Column alignItems="center" gap={4} padding={{ vertical: 24 }}>
            <Text typographyStyle="body-md-strong">
                <Translation id="TR_ACCOUNT_ASSETS_EMPTY_TITLE" />
            </Text>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_ACCOUNT_ASSETS_EMPTY_DESCRIPTION" />
            </Text>
        </Column>
    </Card>
);
