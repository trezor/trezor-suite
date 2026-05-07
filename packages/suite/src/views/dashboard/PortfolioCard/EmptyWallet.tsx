import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Button, Column, H3, Illustration, Paragraph, Row, Text } from '@trezor/components';
import { NetworkIconSet } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

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
                <Row gap={8} flexWrap="wrap" margin={{ top: 12 }}>
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_READY_ON" />:
                    </Paragraph>
                    <NetworkIconSet networks={enabledNetworks} size={20} gap={12} />
                </Row>
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
