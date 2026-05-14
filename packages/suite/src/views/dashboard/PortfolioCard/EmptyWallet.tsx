import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Box, Button, Column, H3, Illustration, Paragraph, Row, Text } from '@trezor/components';
import { NetworkIconSet } from '@trezor/product-components';
import { borders } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const RoundedBorder = styled.div`
    padding: 4px 6px 4px 12px;
    border: dashed 1px ${({ theme }) => theme.elementBorderField};
    border-radius: ${borders.radii.full};
`;

export const EmptyWallet = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const handleReceive = () => {
        analytics.report({
            type: events.dashboardReceiveModalEvent.name,
            payload: { source: 'empty-wallet' },
        });
        dispatch(goto({ routeName: 'suite-index', params: { modal: 'receive' } }));
    };

    const handleBuy = () => {
        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'dashboard/empty-wallet',
            },
        });
        dispatch(goto({ routeName: 'wallet-trading-buy' }));
    };

    return (
        <Column gap={4} data-testid="@dashboard/wallet-ready" alignItems="center">
            <Illustration name="assetsGet" width={224} />
            <H3 margin={{ top: 16 }}>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </H3>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id="TR_DASHBOARD_EMPTY_WALLET_DESC" />
            </Text>
            {enabledNetworks.length > 0 && !isBitcoinOnlyFirmware && (
                <RoundedBorder>
                    <Row gap={8} flexWrap="wrap">
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <Translation id="TR_READY_ON" />:
                        </Paragraph>
                        <Box height={20}>
                            <NetworkIconSet
                                networks={enabledNetworks}
                                size={20}
                                gap={16}
                                maxVisibleIcons={null}
                            />
                        </Box>
                    </Row>
                </RoundedBorder>
            )}
            <Row gap={12} margin={{ top: 16 }}>
                <Button
                    intent="brand"
                    iconLeft="currencyCircleDollar"
                    size="large"
                    onClick={handleBuy}
                    data-testid="@dashboard/empty-wallet/buy"
                >
                    <Translation id="TR_BUY" />
                </Button>
                <Button
                    intent="brand"
                    iconLeft="arrowDown"
                    size="large"
                    onClick={handleReceive}
                    data-testid="@dashboard/empty-wallet/receive"
                >
                    <Translation id="TR_NAV_RECEIVE" />
                </Button>
            </Row>
        </Column>
    );
};
