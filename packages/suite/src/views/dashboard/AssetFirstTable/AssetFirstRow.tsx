import { memo } from 'react';

import { Column, Row, Table, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';

import { type AssetRow } from './assetFirstTableSelectors';
import {
    ASSET_FIRST_CELL_PADDING,
    getAssetDisplaySymbol,
    getAssetName,
    getNetworkName,
} from './assetFirstTableUtils';

type AssetFirstRowProps = {
    row: AssetRow;
    /** Off for the rows under a group heading: the line belongs between groups, not inside one. */
    hasBorderTop?: boolean;
};

/**
 * One asset on one network: what the wallet holds of it, what it costs and where it lives.
 *
 * Renders the row it is given and works nothing out for itself, so these numbers and the total
 * above the table are the same numbers. A row that did not change is the same object, so a balance
 * arriving for another asset does not re-render it — see `selectAssetFirstRows`.
 */
export const AssetFirstRow = memo(({ row, hasBorderTop }: AssetFirstRowProps) => {
    const { symbol, contractAddress, cryptoBalance, tokenInfo } = row;

    return (
        <Table.Row
            hasBorderTop={hasBorderTop}
            data-testid={`@dashboard/asset-first-item/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                <Row gap={12}>
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size={32}
                        showNetworkIcon
                        placeholder={getAssetDisplaySymbol({ symbol, tokenInfo })}
                    />
                    <Column alignItems="flex-start" gap={2}>
                        <Text typographyStyle="body-md" data-testid="@dashboard/asset-first/name">
                            {getAssetName({ symbol, tokenInfo })}
                        </Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {getNetworkName(symbol)}
                        </Text>
                    </Column>
                </Row>
            </Table.Cell>

            <Table.Cell align="end">
                <Column alignItems="flex-end" gap={2}>
                    <PriceTicker symbol={symbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={symbol} contractAddress={contractAddress} />
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                <Column alignItems="flex-end" gap={2}>
                    <BaseCurrencyValue
                        amount={cryptoBalance.toFixed()}
                        symbol={symbol}
                        tokenAddress={contractAddress}
                    />
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <FormattedCryptoAmount
                            value={cryptoBalance.toFixed()}
                            symbol={tokenInfo?.symbol ?? symbol}
                            contractAddress={contractAddress}
                        />
                    </Text>
                </Column>
            </Table.Cell>
        </Table.Row>
    );
});
