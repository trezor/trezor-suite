import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Button, Column, H3, Illustration, Paragraph, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const EmptyWallet = () => {
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const handleReceive = () =>
        dispatch(goto({ routeName: 'suite-index', params: { modal: 'receive' } }));

    const handleBuy = () => dispatch(goto({ routeName: 'wallet-trading-buy' }));

    return (
        <Column gap={spacings.xxs} data-testid="@dashboard/wallet-ready" alignItems="center">
            <Illustration name="networks" width={224} />
            <H3 margin={{ top: spacings.md }}>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </H3>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id="TR_DASHBOARD_EMPTY_WALLET_DESC" />
            </Text>
            {enabledNetworks.length > 0 && (
                <Row gap={spacings.xs} flexWrap="wrap" margin={{ top: spacings.sm }}>
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_READY_ON" />:
                    </Paragraph>
                    <Row gap={spacings.xxs} flexWrap="wrap">
                        {enabledNetworks.map(network => (
                            <CoinLogo key={network} symbol={network} size={16} />
                        ))}
                    </Row>
                </Row>
            )}
            <Row gap={spacings.sm} margin={{ top: spacings.md }}>
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
