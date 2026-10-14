import { Translation } from '@suite/intl';
import { Button, Column, Table, Text } from '@trezor/components';

type HomeAssetSmallBalancesHiddenRowProps = {
    onShowSmallBalances: () => void;
};

export const HomeAssetSmallBalancesHiddenRow = ({
    onShowSmallBalances,
}: HomeAssetSmallBalancesHiddenRowProps) => (
    <Table.Row isHighlightedOnHover={false}>
        <Table.Cell
            colSpan={3}
            align="center"
            maxWidth="100%"
            padding={{ vertical: 24, horizontal: 20 }}
        >
            <Column gap={12} alignItems="center">
                <Text priority="secondary">
                    <Translation id="TR_HOME_ASSET_ONLY_SMALL_BALANCES" />
                </Text>
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={onShowSmallBalances}
                    data-testid="@dashboard/home-asset/show-small-balances"
                >
                    <Translation id="TR_HOME_ASSET_SMALL_BALANCES" />
                </Button>
            </Column>
        </Table.Cell>
    </Table.Row>
);
