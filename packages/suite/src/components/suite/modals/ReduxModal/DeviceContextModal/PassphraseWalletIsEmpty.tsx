import { TrezorDevice } from '@suite-common/suite-types';
import { Button, Card, Column, H3, Paragraph, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { onCancel as onCancelModal } from '../../../../../actions/suite/modalActions';
import { goto } from '../../../../../actions/suite/routerActions';
import { useNetworkSupport } from '../../../../../hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { Translation } from '../../../Translation';

type PassphraseWalletIsEmptyProps = {
    onRetry: () => void;
    onCancel: () => void;
    device: TrezorDevice;
    onNext: () => void;
    onBack: () => void;
};

type PassphraseWalletIsEmptyContentProps = {
    onNext: () => void;
    onRetry: () => void;
    onCancel: () => void;
    'data-testid'?: string;
};

const PassphraseWalletIsEmptyContent = ({
    onNext,
    onRetry,
    onCancel,
    'data-testid': dataTest,
}: PassphraseWalletIsEmptyContentProps) => {
    const { supportedMainnets } = useNetworkSupport();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const dispatch = useDispatch();

    const areAllNetworksEnabled = supportedMainnets.every(network =>
        enabledNetworks.includes(network.symbol),
    );

    return (
        <Column gap={spacings.sm} margin={{ top: spacings.xxs }}>
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
                        <Button
                            size="tiny"
                            variant="info"
                            iconAlignment="end"
                            icon="arrowUpRight"
                            data-testid={dataTest}
                            href={HELP_CENTER_PASSPHRASE_URL}
                        >
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                        </Button>
                    </Row>
                }
            >
                <Column gap={spacings.sm} alignItems="center">
                    <Paragraph typographyStyle="highlight">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION" />
                    </Paragraph>
                    <Button
                        isFullWidth
                        variant="primary"
                        onClick={onNext}
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

export const PassphraseWalletIsEmpty = ({
    onCancel,
    device,
    onBack,
    onRetry,
    onNext,
}: PassphraseWalletIsEmptyProps) => (
    <SwitchDeviceModal onCancel={onCancel}>
        <CardWithDevice
            onCancel={onCancel}
            device={device}
            onBackButtonClick={onBack}
            isFullHeaderVisible
        >
            <PassphraseWalletIsEmptyContent onNext={onNext} onRetry={onRetry} onCancel={onCancel} />
        </CardWithDevice>
    </SwitchDeviceModal>
);
