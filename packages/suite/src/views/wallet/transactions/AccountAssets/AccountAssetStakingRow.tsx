import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { type AccountAsset } from '@suite-common/assets';
import { getNetworkType } from '@suite-common/wallet-config';
import { calculateRewards } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, IconCircle, Row, Table, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PiggyBankIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnRewardsAmount } from 'src/components/earn/dashboard/common/EarnRewardsAmount';
import { EarnStakingRateTooltip } from 'src/components/earn/dashboard/staking/EarnStakingRateTooltip';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { HomeAssetAmount } from 'src/views/home/HomeAssetsTable/HomeAssetAmount';
import {
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_LINE_GAP,
} from 'src/views/home/HomeAssetsTable/homeAssetTableLayout';

type AccountAssetStakingRowProps = {
    accountKey: AccountKey;
    asset: AccountAsset;
};

/** The account's stake, read as the Earn page reads a staking account: its rate, and what a year of it adds. */
export const AccountAssetStakingRow = ({ accountKey, asset }: AccountAssetStakingRowProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { symbol, contractAddress, tokenSymbol, tokenDecimals, amount } = asset;
    const { rate } = useStakingRate({ symbol, accountKey });

    const open = () => dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }));

    return (
        <Table.Row onClick={open} data-testid={`@wallet/account-asset/staking/${symbol}`}>
            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                <Row gap={12} minWidth={0}>
                    <IconCircle icon={PiggyBankIcon} size={32} intent="brand" />
                    <Column alignItems="flex-start" gap={HOME_ASSET_LINE_GAP} minWidth={0}>
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_STAKING" />
                        </Text>
                        <EarnStakingRateTooltip networkType={getNetworkType(symbol)} rate={rate} />
                    </Column>
                </Row>
            </Table.Cell>

            <Table.Cell align="end">
                {/* The stake has no price of its own; this is what a year at the rate would add. */}
                {rate !== null && rate > 0 && (
                    <EarnRewardsAmount
                        symbol={symbol}
                        rewards={calculateRewards(amount, rate)}
                        apy={rate}
                        intent="brand"
                        data-testid="@wallet/account-asset/staking/rewards"
                    />
                )}
            </Table.Cell>

            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <HomeAssetAmount
                    symbol={symbol}
                    contractAddress={contractAddress}
                    tokenSymbol={tokenSymbol}
                    tokenDecimals={tokenDecimals}
                    amount={amount}
                />
            </Table.Cell>
        </Table.Row>
    );
};
