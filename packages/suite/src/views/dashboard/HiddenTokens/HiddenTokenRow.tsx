import { memo, useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { Column, Icon, Row, Table, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

import { type AssetAccounts } from '../HomeAssetTable/homeAssetTableSelectors';
import {
    HOME_ASSET_CELL_PADDING,
    getAssetDisplaySymbol,
    getAssetName,
    sumAssetAccounts,
} from '../HomeAssetTable/homeAssetTableUtils';

type HiddenTokenRowProps = {
    assetAccounts: AssetAccounts;
    onClick: () => void;
    isCollapsed?: boolean;
};

export const HiddenTokenRow = memo(
    ({ assetAccounts, onClick, isCollapsed }: HiddenTokenRowProps) => {
        const { NetworkNameFormatter } = useFormatters();
        const [{ symbol, contractAddress }] = assetAccounts;
        const { cryptoBalance, tokenInfo } = useMemo(
            () => sumAssetAccounts(assetAccounts),
            [assetAccounts],
        );

        return (
            <Table.Row
                onClick={onClick}
                isCollapsed={isCollapsed}
                data-testid={`@hidden-tokens/item/${symbol}/${contractAddress ?? 'coin'}`}
            >
                <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                    <Row gap={12}>
                        <TokenIcon
                            symbol={symbol}
                            contractAddress={contractAddress}
                            size={32}
                            showNetworkIcon
                            placeholder={getAssetDisplaySymbol({ symbol, tokenInfo })}
                        />
                        <Column alignItems="flex-start" gap={2}>
                            <Text typographyStyle="body-md">
                                {getAssetName({ symbol, tokenInfo })}
                            </Text>
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <NetworkNameFormatter value={symbol} />
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

                <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                    <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
                </Table.Cell>
            </Table.Row>
        );
    },
);
