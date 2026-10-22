import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { selectWalletAssetContractAddress, selectWalletAssetSymbol } from '@suite-common/assets';
import {
    type WalletAssetKey,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Card, Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { HomeBalanceChange } from 'src/views/home/HomeBalance/HomeBalanceChange';
import { HomeTotalBalance } from 'src/views/home/HomeBalance/HomeTotalBalance';

type AssetDetailMarketPriceProps = {
    assetKey: WalletAssetKey;
};

/** What one unit of the asset costs, and how that moved over the week, styled as the Home total. */
export const AssetDetailMarketPrice = ({ assetKey }: AssetDetailMarketPriceProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey =
        symbol === undefined ? undefined : getFiatRateKey(symbol, baseCurrency, contractAddress);
    const rate = useSelector(state =>
        fiatRateKey === undefined
            ? undefined
            : selectFiatRatesByFiatRateKey(state, fiatRateKey)?.rate,
    );
    const weekAgoRate = useSelector(state =>
        fiatRateKey === undefined
            ? undefined
            : selectFiatRatesByFiatRateKey(state, fiatRateKey, 'lastWeek')?.rate,
    );

    const price = useMemo(() => (rate === undefined ? undefined : new BigNumber(rate)), [rate]);
    const weekChange = useMemo(() => {
        if (price === undefined || !weekAgoRate) {
            return undefined;
        }

        const change = price.minus(weekAgoRate);

        return { change, changePercent: change.div(weekAgoRate) };
    }, [price, weekAgoRate]);

    // An asset with no market leaves the screen to its balance card, rather than a card with
    // nothing in it.
    if (symbol === undefined || price === undefined) {
        return null;
    }

    return (
        <Card data-testid="@asset-detail/market-price">
            <Column gap={8} alignItems="flex-start">
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_ASSET_DETAIL_MARKET_PRICE" />
                </Text>
                <HomeTotalBalance
                    fiatValue={price}
                    data-testid="@asset-detail/market-price/fiat-amount"
                />
                {weekChange !== undefined && (
                    <HomeBalanceChange
                        period={<Translation id="TR_HOME_ASSET_WEEK_PERIOD" />}
                        change={weekChange.change}
                        changePercent={weekChange.changePercent}
                        data-testid="@asset-detail/market-price/week-change"
                    />
                )}
            </Column>
        </Card>
    );
};
