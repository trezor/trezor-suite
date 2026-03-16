import { Translation } from '@suite/intl';
import { closeModal as closeModalAction } from '@suite/modal';
import { goto } from '@suite/router';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Button, Card, Column, H3, Paragraph, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { useNetworkSupport } from '../../../../../hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';

type PassphraseWalletIsEmptyProps = {
    onRetry: () => void;
    onCancel: () => void;
    device: TrezorDevice;
    onNext: () => void;
    onBack: () => void;
    accountFailed?: boolean;
};

type PassphraseWalletIsEmptyContentProps = {
    onNext: () => void;
    onRetry: () => void;
    onCancel: () => void;
    'data-testid'?: string;
    accountFailed?: boolean;
};

const PassphraseWalletIsEmptyContent = ({
    onNext,
    onRetry,
    onCancel,
    'data-testid': dataTest,
    accountFailed,
}: PassphraseWalletIsEmptyContentProps) => {
    const { supportedMainnets } = useNetworkSupport();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const dispatch = useDispatch();

    const areAllNetworksEnabled = supportedMainnets.every(network =>
        enabledNetworks.includes(network.symbol),
    );

    return (
        <Column gap={spacings.sm}>
            <H3>
                <Translation
                    id={
                        accountFailed
                            ? 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE_ERROR'
                            : 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE'
                    }
                />
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
                            size="small"
                            intent="info"
                            data-testid={dataTest}
                            href={HELP_CENTER_PASSPHRASE_URL}
                        >
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                        </Button>
                    </Row>
                }
            >
                <Column gap={spacings.sm} alignItems="center">
                    <Paragraph typographyStyle="body-md-strong">
                        <Translation
                            id={
                                accountFailed
                                    ? 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION_ERROR'
                                    : 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION'
                            }
                        />
                    </Paragraph>
                    <Button
                        width="100%"
                        intent="brand"
                        onClick={onNext}
                        data-testid="@passphrase-confirmation/step1-open-unused-wallet-button"
                    >
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON" />
                    </Button>
                </Column>
            </Card>
            <Card paddingType="small">
                <Column gap={spacings.xxxs} alignItems="flex-start">
                    <Paragraph typographyStyle="body-md-strong">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION" />
                    </Paragraph>
                    {!areAllNetworksEnabled && (
                        <Row gap={spacings.xs} flexWrap="wrap">
                            <Paragraph
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                            >
                                <Translation id="TR_CHECKED_BALANCES_ON" />:
                            </Paragraph>
                            <Row gap={spacings.xxs} flexWrap="wrap">
                                {enabledNetworks.map(network => (
                                    <CoinLogo key={network} symbol={network} size={16} />
                                ))}
                            </Row>
                            {onCancel && (
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    iconLeft="plus"
                                    size="small"
                                    onClick={() => {
                                        onCancel();
                                        dispatch(closeModalAction());
                                        dispatch(goto({ routeName: 'settings-coins' }));
                                    }}
                                >
                                    <Translation id="TR_ADD" />
                                </Button>
                            )}
                        </Row>
                    )}
                    <Button
                        width="100%"
                        intent="neutral"
                        priority="secondary"
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
    accountFailed,
}: PassphraseWalletIsEmptyProps) => (
    <SwitchDeviceModal onCancel={onCancel}>
        <CardWithDevice onCancel={onCancel} device={device} onBackButtonClick={onBack}>
            <PassphraseWalletIsEmptyContent
                onNext={onNext}
                onRetry={onRetry}
                onCancel={onCancel}
                accountFailed={accountFailed}
            />
        </CardWithDevice>
    </SwitchDeviceModal>
);
