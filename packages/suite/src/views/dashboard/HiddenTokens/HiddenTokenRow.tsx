import { memo } from 'react';

import { Column, Icon, Row, Table, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

import { type AssetTotal } from '../AssetFirstTable/assetFirstTableSelectors';
import {
    ASSET_FIRST_CELL_PADDING,
    getAssetDisplaySymbol,
    getAssetName,
    getNetworkName,
} from '../AssetFirstTable/assetFirstTableUtils';

type HiddenTokenRowProps = {
    asset: AssetTotal;
    onClick: () => void;
    isCollapsed?: boolean;
};

export const HiddenTokenRow = memo(({ asset, onClick, isCollapsed }: HiddenTokenRowProps) => {
    const { symbol, contractAddress, cryptoBalance, tokenInfo } = asset;

    return (
        <Table.Row
            onClick={onClick}
            isCollapsed={isCollapsed}
            data-testid={`@hidden-tokens/item/${symbol}/${contractAddress ?? 'coin'}`}
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
                        <Text typographyStyle="body-md">{getAssetName({ symbol, tokenInfo })}</Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {getNetworkName(symbol)}
                        </Text>
                    </Column>
                </Row>
            </Table.Cell>

            <Table.Cell align="end">
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

            <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
            </Table.Cell>
        </Table.Row>
    );
});
