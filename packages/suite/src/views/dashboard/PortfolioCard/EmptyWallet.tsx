import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Button, Column, H3, IconCircle, Paragraph, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const EmptyWallet = () => {
    const { supportedMainnets } = useNetworkSupport();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const dispatch = useDispatch();

    const areAllNetworksEnabled = supportedMainnets.every(network =>
        enabledNetworks.includes(network.symbol),
    );

    return (
        <Column gap={4} data-testid="@dashboard/wallet-ready" alignItems="center">
            <IconCircle name="check" size={96} intent="brand" />
            <H3 margin={16}>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </H3>
            {!areAllNetworksEnabled && (
                <Row gap={8} flexWrap="wrap">
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_CHECKED_BALANCES_ON" />:
                    </Paragraph>
                    <Row gap={4} flexWrap="wrap">
                        {enabledNetworks.map(network => (
                            <CoinLogo key={network} symbol={network} size={16} />
                        ))}
                    </Row>
                    <Button
                        intent="brand"
                        iconLeft="plus"
                        size="small"
                        onClick={() => {
                            dispatch(goto({ routeName: 'settings-coins' }));
                        }}
                    >
                        <Translation id="TR_ADD" />
                    </Button>
                </Row>
            )}
        </Column>
    );
};
