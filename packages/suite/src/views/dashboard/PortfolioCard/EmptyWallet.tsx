import { H3, Row, Paragraph, Button, Column, IconCircle } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { selectIsDeviceUsingPassphrase } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';

export const EmptyWallet = () => {
    const { supportedMainnets } = useNetworkSupport();
    const isPassphraseType = useSelector(selectIsDeviceUsingPassphrase);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const dispatch = useDispatch();

    const areAllNetworksEnabled = supportedMainnets.every(network =>
        enabledNetworks.includes(network.symbol),
    );

    return (
        <Column gap={spacings.xxs} data-testid="@dashboard/wallet-ready" alignItems="center">
            <IconCircle name="check" size="extraLarge" variant="primary" />
            <H3 margin={{ top: spacings.md }}>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </H3>
            {isPassphraseType && !areAllNetworksEnabled && (
                <Row gap={spacings.xs} flexWrap="wrap">
                    <Paragraph variant="tertiary" typographyStyle="hint">
                        <Translation id="TR_CHECKED_BALANCES_ON" />:
                    </Paragraph>
                    <Row gap={spacings.xxs} flexWrap="wrap">
                        {enabledNetworks.map(network => (
                            <CoinLogo key={network} symbol={network} size={16} />
                        ))}
                    </Row>
                    <Button
                        variant="tertiary"
                        icon="plus"
                        size="tiny"
                        onClick={() => {
                            dispatch(goto('settings-coins'));
                        }}
                    >
                        <Translation id="TR_ADD" />
                    </Button>
                </Row>
            )}
        </Column>
    );
};
