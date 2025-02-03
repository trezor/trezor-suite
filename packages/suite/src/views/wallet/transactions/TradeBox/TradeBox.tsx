import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import {
    Button,
    Card,
    Flex,
    InfoItem,
    Row,
    Text,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { CoinLogo } from '@trezor/product-components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { DashboardSection } from 'src/components/dashboard';
import { PriceTicker, Translation, TrendTicker } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

type TradeBoxProps = {
    account: Account;
};

export const TradeBox = ({ account }: TradeBoxProps) => {
    const isBelowTablet = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);
    const isBelowMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const isTestnet = getNetwork(account.symbol).testnet;

    const ActionButton = ({
        type,
        children,
        isDisabled = false,
    }: {
        type: 'buy' | 'exchange' | 'sell';
        children: React.ReactNode;
        isDisabled?: boolean;
    }) => (
        <Button
            variant="tertiary"
            size="small"
            onClick={() => {
                analytics.report({
                    type: EventType.AccountsTradeboxButton,
                    payload: {
                        symbol: account.symbol,
                        type,
                    },
                });
                dispatch(goto(`wallet-trading-${type}`, { preserveParams: true }));
            }}
            data-testid={`@trading/menu/wallet-trading-${type}`}
            isDisabled={isDisabled}
        >
            {children}
        </Button>
    );

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
                            <CoinLogo size={36} symbol={account.symbol} type="badge" />
                            <InfoItem
                                label={getNetworkDisplaySymbolName(account.symbol)}
                                typographyStyle="highlight"
                                variant="default"
                                gap={0}
                                width="fit-content"
                            >
                                <Text variant="tertiary" typographyStyle="hint">
                                    {getNetworkDisplaySymbol(account.symbol)}
                                </Text>
                            </InfoItem>
                        </Row>
                        <InfoItem label={<Translation id="TR_EXCHANGE_RATE" />} width="fit-content">
                            <PriceTicker
                                symbol={account.symbol}
                                noEmptyStateTooltip={isTestnet}
                                showLoadingSkeleton={!isTestnet}
                            />
                        </InfoItem>
                        <InfoItem label={<Translation id="TR_7D_CHANGE" />} width="fit-content">
                            <TrendTicker
                                symbol={account.symbol}
                                noEmptyStateTooltip={isTestnet}
                                showLoadingSkeleton={!isTestnet}
                            />
                        </InfoItem>
                    </Flex>
                    <Row gap={spacings.sm}>
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
