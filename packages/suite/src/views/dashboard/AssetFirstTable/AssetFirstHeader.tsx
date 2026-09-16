import { Translation } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectDispatch } from '@suite-common/redux-utils';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { selectAccountByKey, selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Button, Column, Row, Skeleton, Text } from '@trezor/components';
import { ArrowDownIcon, ArrowUpIcon, ArrowsLeftRightIcon } from '@trezor/icons';
import { type BigNumber } from '@trezor/utils';

import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import {
    selectAssetFirstLargestHoldingAccountKey,
    selectAssetFirstTotals,
} from './assetFirstTableSelectors';

type WeekChangeProps = {
    weekChange: BigNumber;
};

const WeekChange = ({ weekChange }: WeekChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isGain = weekChange.gte(0);

    return (
        <Text
            typographyStyle="body-sm"
            intent={isGain ? 'brand' : 'critical'}
            data-testid="@dashboard/asset-first/week-change"
        >
            <Translation
                id="TR_ASSET_FIRST_WEEK_CHANGE"
                values={{
                    value: `${isGain ? '+' : '−'}${BaseCurrencyAmountFormatter.format(
                        asBaseCurrencyAmount(weekChange.abs()),
                    )}`,
                }}
            />
        </Text>
    );
};

type AssetFirstActionProps = {
    account: Account | null;
};

/**
 * Swap, receive and send for the wallet rather than for an account.
 *
 * The routes behind them are account-scoped, so they open on the wallet's largest holding — the
 * account someone is most likely to have meant. A prototype's answer to a question the design
 * leaves open.
 */
const AssetFirstActions = ({ account }: AssetFirstActionProps) => {
    const { dispatch } = useServices(selectDispatch);

    const goToAccountRoute = (
        routeName: Extract<Route['name'], 'wallet-receive' | 'wallet-send'>,
    ) =>
        account &&
        dispatch(
            gotoThunk({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    const handleSwapClick = () => {
        if (account) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );
        }
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));
    };

    return (
        <Row gap={8}>
            <Button
                intent="brand"
                priority="primary"
                iconRight={ArrowsLeftRightIcon}
                onClick={handleSwapClick}
                data-testid="@dashboard/asset-first/swap"
            >
                <Translation id="TR_TRADING_SWAP" />
            </Button>
            <Button
                intent="brand"
                priority="secondary"
                iconRight={ArrowDownIcon}
                isDisabled={!account}
                onClick={() => goToAccountRoute('wallet-receive')}
                data-testid="@dashboard/asset-first/receive"
            >
                <Translation id="TR_NAV_RECEIVE" />
            </Button>
            <Button
                intent="brand"
                priority="secondary"
                iconRight={ArrowUpIcon}
                isDisabled={!account}
                onClick={() => goToAccountRoute('wallet-send')}
                data-testid="@dashboard/asset-first/send"
            >
                <Translation id="TR_NAV_SEND" />
            </Button>
        </Row>
    );
};

export const AssetFirstHeader = () => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { fiatValue, weekChange } = useSelector(selectAssetFirstTotals);
    const largestHoldingAccountKey = useSelector(selectAssetFirstLargestHoldingAccountKey);
    const largestHoldingAccount = useSelector(state =>
        selectAccountByKey(state, largestHoldingAccountKey ?? null),
    );
    const { isDiscoveryRunning } = useDiscovery();

    return (
        <Row justifyContent="space-between" alignItems="center" gap={16}>
            <Column alignItems="flex-start" gap={4}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_ASSET_FIRST_TOTAL_BALANCE" />
                </Text>
                {isDiscoveryRunning ? (
                    <Skeleton width={180} height={44} />
                ) : (
                    <Row alignItems="baseline" gap={12}>
                        <FiatHeader
                            data-testid="@dashboard/asset-first/fiat-amount"
                            size="large"
                            amount={fiatValue.toFixed()}
                            localCurrency={baseCurrencyCode}
                        />
                        {weekChange !== undefined && <WeekChange weekChange={weekChange} />}
                    </Row>
                )}
            </Column>
            <AssetFirstActions account={largestHoldingAccount} />
        </Row>
    );
};
