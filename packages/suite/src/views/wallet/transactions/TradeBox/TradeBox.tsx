import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Route } from '@suite-common/suite-types';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { getNetworkDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Button, Card, Flex, InfoItem, Row, Text } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { DashboardSection } from 'src/components/dashboard';
import { PriceTicker, TrendTicker } from 'src/components/suite';
import { useDevice, useDispatch, useLayoutSize } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { Account } from 'src/types/wallet';

type TradeBoxProps = {
    account: Account;
};

type ActionType = 'buy' | 'sell' | 'exchange' | 'stake';

export const TradeBox = ({ account }: TradeBoxProps) => {
    const { isBelowTablet, isBelowMobile } = useLayoutSize();
    const dispatch = useDispatch();
    const { device } = useDevice();
    const analytics = useAnalytics();
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account.symbol);

    const isStakeNetwork = hasNetworkFeatures(account, 'staking');

    const ActionButton = ({
        type,
        children,
        isDisabled = false,
    }: {
        type: ActionType;
        children: React.ReactNode;
        isDisabled?: boolean;
    }) => {
        const gotoRouteName: Route['name'] =
            type === 'stake' ? 'wallet-staking' : `wallet-trading-${type}`;
        const dataTestId = type === 'stake' ? undefined : `@trading/menu/wallet-trading-${type}`;

        const handleOnClick = () => {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );

            dispatch(goto({ routeName: gotoRouteName }));

            switch (type) {
                case 'buy':
                case 'sell':
                case 'exchange': {
                    analytics.report({
                        type: events.tradeNavigateEvent.name,
                        payload: {
                            action: 'navigate',
                            type,
                            from: 'account/tradebox',
                            networkSymbol: account.symbol,
                        },
                    });

                    break;
                }
                case 'stake': {
                    analytics.report({
                        type: events.stakingNavigateEvent.name,
                        payload: {
                            action: 'navigate',
                            from: 'account/tradebox',
                            networkSymbol: account.symbol,
                        },
                    });

                    break;
                }
                default:
                    exhaustive(type);
            }
        };

        return (
            <Button
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={handleOnClick}
                data-testid={dataTestId}
                isDisabled={isDisabled}
            >
                {children}
            </Button>
        );
    };

    return (
        <DashboardSection heading={<Translation id="TR_NAV_TRADE" />}>
            <Card>
                <Flex
                    direction={isBelowTablet ? 'column' : 'row'}
                    flexWrap="wrap"
                    justifyContent={isBelowTablet ? 'flex-start' : 'space-between'}
                    gap={spacings.lg}
                >
                    <Flex
                        direction={isBelowMobile ? 'column' : 'row'}
                        gap={isBelowMobile ? spacings.md : spacings.xxxl}
                    >
                        <Row gap={spacings.sm}>
                            <CoinLogo size={36} symbol={account.symbol} type="tokenWithNetwork" />
                            <InfoItem
                                label={getNetworkDisplaySymbolName(account.symbol)}
                                typographyStyle="body-md-strong"
                                intent="neutral"
                                priority="primary"
                                gap={0}
                                width="fit-content"
                            >
                                <Text
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                >
                                    {getNetworkDisplaySymbol(account.symbol)}
                                </Text>
                            </InfoItem>
                        </Row>
                        {shallDisplayBaseCurrency ? (
                            <>
                                <InfoItem
                                    label={<Translation id="TR_EXCHANGE_RATE" />}
                                    width="fit-content"
                                >
                                    <PriceTicker
                                        symbol={account.symbol}
                                        showLoadingSkeleton={true}
                                    />
                                </InfoItem>
                                <InfoItem
                                    label={<Translation id="TR_7D_CHANGE" />}
                                    width="fit-content"
                                >
                                    <TrendTicker
                                        symbol={account.symbol}
                                        showLoadingSkeleton={true}
                                    />
                                </InfoItem>
                            </>
                        ) : null}
                    </Flex>
                    <Row gap={spacings.sm}>
                        {isStakeNetwork && (
                            <ActionButton type="stake">
                                <Translation id="TR_STAKE_STAKE" />
                            </ActionButton>
                        )}
                        <ActionButton type="buy">
                            <Translation id="TR_NAV_BUY" />
                        </ActionButton>
                        <ActionButton type="sell" isDisabled={account.empty}>
                            <Translation id="TR_NAV_SELL" />
                        </ActionButton>
                        {!hasBitcoinOnlyFirmware(device) && (
                            <ActionButton type="exchange" isDisabled={account.empty}>
                                <Translation id="TR_TRADING_SWAP" />
                            </ActionButton>
                        )}
                    </Row>
                </Flex>
            </Card>
        </DashboardSection>
    );
};
