import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';

type AssetDetailMenuNetworkRowProps = {
    symbol: NetworkSymbol;
};

export const AssetDetailMenuNetworkRow = ({ symbol }: AssetDetailMenuNetworkRowProps) => {
    const { NetworkNameFormatter } = useFormatters();

    return (
        <Row
            gap={12}
            padding={{ vertical: 8, horizontal: 12 }}
            justifyContent="space-between"
            data-testid="@asset-detail/menu/network"
        >
            <Text intent="neutral" textWrap="nowrap">
                <Translation id="TR_NETWORK_TITLE" />
            </Text>
            <Row gap={8}>
                <Text intent="neutral" textWrap="nowrap">
                    <NetworkNameFormatter value={symbol} />
                </Text>
                <NetworkIcon networkSymbol={symbol} size={16} />
            </Row>
        </Row>
    );
};
