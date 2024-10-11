import { Dispatch } from 'react';
import { spacings } from '@trezor/theme';
import { Column, Card, Row, Button, H3, Paragraph } from '@trezor/components';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { CoinLogo } from '@trezor/product-components';

import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { ContentType } from './types';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { onCancel as onCancelModal } from 'src/actions/suite/modalActions';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';

type PassphraseWalletConfirmationStep1Props = {
    setContentType: Dispatch<React.SetStateAction<ContentType>>;
    onRetry: () => void;
    onCancel: () => void;
    'data-testid'?: string;
};

export const PassphraseWalletConfirmationStep1 = ({
    setContentType,
    onRetry,
    onCancel,
    'data-testid': dataTest,
}: PassphraseWalletConfirmationStep1Props) => {
    const { enabledNetworks, mainnets } = useEnabledNetworks();
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const dispatch = useDispatch();

    const supportedNetworks = mainnets.filter(({ symbol }) =>
        deviceSupportedNetworkSymbols.includes(symbol),
    );

    const areAllNetworksEnabled = supportedNetworks.length === enabledNetworks.length;

    return (
        <Column gap={spacings.sm} margin={{ top: spacings.xxs }} alignItems="stretch">
            <H3>
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE" />
            </H3>
            <Card
                paddingType="small"
                label={
                    <Row
                        justifyContent="space-between"
                        margin={{ top: spacings.xxxs, bottom: spacings.xxs }}
                    >
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT" />
                        <TrezorLink type="hint" variant="nostyle" href={HELP_CENTER_PASSPHRASE_URL}>
                            <Button
                                size="tiny"
                                variant="info"
                                iconAlignment="right"
                                icon="arrowUpRight"
                                data-testid={dataTest}
                            >
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                            </Button>
                        </TrezorLink>
                    </Row>
                }
            >
                <Column gap={spacings.sm}>
                    <Paragraph typographyStyle="highlight">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION" />
                    </Paragraph>
                    <Button
                        isFullWidth
                        variant="primary"
                        onClick={() => {
                            setContentType('step2');
                        }}
                        data-testid="@passphrase-confirmation/step1-open-unused-wallet-button"
                    >
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON" />
                    </Button>
                </Column>
            </Card>
            <Card paddingType="small">
                <Column gap={spacings.xxxs} alignItems="flex-start">
                    <Paragraph typographyStyle="highlight">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION" />
                    </Paragraph>
                    {!areAllNetworksEnabled && (
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
                                    onCancel();
                                    dispatch(onCancelModal());
                                    dispatch(goto('settings-coins'));
                                }}
                            >
                                <Translation id="TR_ADD" />
                            </Button>
                        </Row>
                    )}
                    <Button
                        isFullWidth
                        variant="tertiary"
                        onClick={onRetry}
                        margin={{ top: spacings.md }}
                        data-testid="@passphrase-confirmation/step1-retry-button"
                    >
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON" />
                    </Button>
                </Column>
            </Card>
        </Column>
    );
};
