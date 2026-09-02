import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { Card, Flex, InfoItem, Row, Text } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { TokenIcon } from '@trezor/product-components';

import { DashboardSection } from 'src/components/dashboard';
import { YieldBadge } from 'src/components/earn/YieldBadge/YieldBadge';
import { PriceTicker, TrendTicker } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import { TradeBoxActionButton } from './TradeBoxActionButton';
import { WrapNativeTokenButton } from './WrapNativeTokenButton';
import { useTradeBoxEarnOptions } from './hooks/useTradeBoxEarnOptions';

type TradeBoxProps = {
    account: Account;
};

export const TradeBox = ({ account }: TradeBoxProps) => {
    const { isBelowTablet, isBelowMobile } = useLayoutSize();
    const { device } = useDevice();
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account.symbol);
    const { hasEarnOption, yieldBadge } = useTradeBoxEarnOptions(account);

    return (
        <DashboardSection>
            <Card>
                <Flex
                    direction={isBelowTablet ? 'column' : 'row'}
                    flexWrap="wrap"
                    justifyContent={isBelowTablet ? 'flex-start' : 'space-between'}
                    gap={20}
                >
                    <Flex
                        direction={isBelowMobile ? 'column' : 'row'}
                        gap={isBelowMobile ? 16 : 40}
                    >
                        <Row gap={12}>
                            <TokenIcon size={40} symbol={account.symbol} showNetworkIcon />
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
                        {yieldBadge && (
                            <Row alignItems="center">
                                <YieldBadge
                                    apy={yieldBadge.apy}
                                    variant="promo"
                                    account={account}
                                    vaultId={yieldBadge.vaultId}
                                    analyticsFrom="account-tradebox"
                                />
                            </Row>
                        )}
                    </Flex>
                    <Row gap={12}>
                        {hasEarnOption && (
                            <TradeBoxActionButton account={account} type="earn">
                                <Translation id="TR_EARN" />
                            </TradeBoxActionButton>
                        )}
                        <TradeBoxActionButton account={account} type="buy">
                            <Translation id="TR_NAV_BUY" />
                        </TradeBoxActionButton>
                        <TradeBoxActionButton
                            account={account}
                            type="sell"
                            isDisabled={account.empty}
                        >
                            <Translation id="TR_NAV_SELL" />
                        </TradeBoxActionButton>
                        {!hasBitcoinOnlyFirmware(device) && (
                            <TradeBoxActionButton
                                account={account}
                                type="exchange"
                                isDisabled={account.empty}
                            >
                                <Translation id="TR_TRADING_SWAP" />
                            </TradeBoxActionButton>
                        )}
                        <WrapNativeTokenButton account={account} />
                    </Row>
                </Flex>
            </Card>
        </DashboardSection>
    );
};
