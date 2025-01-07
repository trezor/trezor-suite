import { spacings } from '@trezor/theme';
import {
    Card,
    Row,
    variables,
    Flex,
    Text,
    InfoItem,
    Button,
    useMediaQuery,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from 'src/actions/suite/routerActions';
import { Account } from 'src/types/wallet';
import { Translation, PriceTicker, TrendTicker } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { DashboardSection } from 'src/components/dashboard';

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
                dispatch(goto(`wallet-coinmarket-${type}`, { preserveParams: true }));
            }}
            data-testid={`@coinmarket/menu/wallet-coinmarket-${type}`}
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
                            <CoinLogo size={24} symbol={account.symbol} />
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
                                <Translation id="TR_COINMARKET_SWAP" />
                            </ActionButton>
                        )}
                    </Row>
                </Flex>
            </Card>
        </DashboardSection>
    );
};
