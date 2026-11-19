import { gotoThunk } from '@suite/router';
import { type AccountAsset } from '@suite-common/assets';
import { Column, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { PriceTicker, TrendTicker } from '#src/components/suite';
import { HomeAssetAmount } from '#src/views/home/HomeAssetsTable/HomeAssetAmount';
import { HomeAssetApyBadge } from '#src/views/home/HomeAssetsTable/HomeAssetApyBadge';
import { HomeAssetIdentity } from '#src/views/home/HomeAssetsTable/HomeAssetIdentity';
import {
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_LINE_GAP,
} from '#src/views/home/HomeAssetsTable/homeAssetTableLayout';

type AccountAssetRowProps = {
    asset: AccountAsset;
};

export const AccountAssetRow = ({ asset }: AccountAssetRowProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { kind, networkSymbol, contractAddress, tokenSymbol, tokenDecimals, amount } = asset;

    const open = () =>
        dispatch(
            gotoThunk({
                routeName: 'suite-asset',
                params: { symbol: networkSymbol, contractAddress },
            }),
        );

    return (
        <Table.Row
            onClick={open}
            data-testid={`@wallet/account-asset/${kind}/${contractAddress ?? networkSymbol}`}
        >
            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                <HomeAssetIdentity
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    badge={
                        <HomeAssetApyBadge
                            symbol={networkSymbol}
                            contractAddress={contractAddress}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
                        />
                    }
                />
            </Table.Cell>

            <Table.Cell align="end">
                <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
                    <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <HomeAssetAmount
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    amount={amount}
                />
            </Table.Cell>
        </Table.Row>
    );
};
