import { Translation } from '@suite/intl';
import { Table, Text } from '@trezor/components';

export const AccountAssetNoSearchResultsRow = () => (
    <Table.Row isHighlightedOnHover={false} data-testid="@wallet/account-assets/no-search-results">
        <Table.Cell
            colSpan={3}
            align="center"
            maxWidth="100%"
            padding={{ vertical: 24, horizontal: 20 }}
        >
            <Text priority="secondary">
                <Translation id="TR_NO_SEARCH_RESULTS" />
            </Text>
        </Table.Cell>
    </Table.Row>
);
