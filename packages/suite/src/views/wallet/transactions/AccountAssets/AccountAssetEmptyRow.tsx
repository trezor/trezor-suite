import { Translation } from '@suite/intl';
import { Column, Table, Text } from '@trezor/components';

/** The row of a table with nothing to list; its menu, with the hidden tokens, stays above it. */
export const AccountAssetEmptyRow = () => (
    <Table.Row isHighlightedOnHover={false} data-testid="@wallet/account-assets/empty">
        <Table.Cell colSpan={3} align="center" maxWidth="100%" padding={{ vertical: 24 }}>
            <Column alignItems="center" gap={4}>
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_ACCOUNT_ASSETS_EMPTY_TITLE" />
                </Text>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_ACCOUNT_ASSETS_EMPTY_DESCRIPTION" />
                </Text>
            </Column>
        </Table.Cell>
    </Table.Row>
);
