import { memo, useMemo } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type AccountAssetKey,
    parseAccountAssetKey,
    selectAccountsByAssetKey,
} from '@suite-common/wallet-core';
import { Column, Row, Table, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableLayout';
import {
    getAssetDisplaySymbol,
    getAssetHolding,
    getAssetName,
    getNetworkName,
} from './assetFirstTableUtils';

type AssetFirstRowProps = {
    assetKey: AccountAssetKey;
};

/**
 * One asset on one network: what the wallet holds of it, what it costs and where it lives.
 *
 * The row reads its own accounts out of the index, so a balance arriving for another asset does not
 * re-render it — see `accountsIndex`.
 */
export const AssetFirstRow = memo(({ assetKey }: AssetFirstRowProps) => {
    const accounts = useSelector(state => selectAccountsByAssetKey(state, assetKey));
    const { dispatch } = useServices(selectDispatch);

    const parts = parseAccountAssetKey(assetKey);
    const contractAddress = parts?.contractAddress;

    const { cryptoBalance, tokenInfo } = useMemo(
        () => getAssetHolding(accounts, contractAddress),
        [accounts, contractAddress],
    );

    if (parts === undefined) {
        return null;
    }

    const { symbol } = parts;
    const [firstAccount] = accounts;

    const handleRowClick = () => {
        if (!firstAccount) {
            return;
        }

        dispatch(
            gotoThunk({
                routeName: contractAddress === undefined ? 'wallet-index' : 'wallet-tokens',
                params: {
                    symbol,
                    accountIndex: firstAccount.index,
                    accountType: firstAccount.accountType,
                },
            }),
        );
    };

    return (
        <Table.Row
            onClick={handleRowClick}
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
