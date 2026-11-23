import { Translation } from '@suite/intl';
import { Card, Column, Text, TextButton } from '@trezor/components';

type AccountAssetEmptyStateProps = {
    /** Given when the account holds only hidden tokens, so they stay reachable. */
    onOpenHiddenTokens?: () => void;
};

export const AccountAssetEmptyState = ({ onOpenHiddenTokens }: AccountAssetEmptyStateProps) => (
    <Card data-testid="@wallet/account-assets/empty">
        <Column alignItems="center" gap={4} padding={{ vertical: 24 }}>
            <Text typographyStyle="body-md-strong">
                <Translation id="TR_ACCOUNT_ASSETS_EMPTY_TITLE" />
            </Text>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_ACCOUNT_ASSETS_EMPTY_DESCRIPTION" />
            </Text>
            {onOpenHiddenTokens && (
                <TextButton
                    type="button"
                    size="small"
                    onClick={onOpenHiddenTokens}
                    data-testid="@wallet/account-assets/empty/hidden-tokens"
                >
                    <Translation id="TR_HIDDEN_TOKENS" />
                </TextButton>
            )}
        </Column>
    </Card>
);
