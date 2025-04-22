import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { TrezorDevice } from '@suite-common/suite-types';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { Card, Column, DotIndicator, H4, Modal, Row, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { CoinLogo, ConfirmOnDevice } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

import { ConfirmActionModal } from './ConfirmActionModal';

interface SignMessageModalProps {
    device: TrezorDevice;
    message: string;
    coin?: string;
    serializedPath?: string;
}

export const SignMessageModal = ({
    device,
    message,
    coin,
    serializedPath,
}: SignMessageModalProps) => {
    const popupCall = useSelector(selectConnectPopupCall);
    const accounts = useSelector(selectDeviceAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const deviceModelInternal = device.features?.internal_model;

    if (!popupCall || popupCall?.state !== 'ongoing') return <ConfirmActionModal device={device} />;

    const onCancel = () => {
        TrezorConnect.cancel();
    };

    // Connect's coin shortcut (uppercase) <-> Suite's network symbol (lowercase)
    const networkSymbol = coin?.toLowerCase() as NetworkSymbol;
    const network = networkSymbol ? getNetwork(networkSymbol) : undefined;
    const account = accounts.find(a => a.symbol === networkSymbol && a.path === serializedPath);

    return (
        <Modal.Backdrop>
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={deviceModelInternal}
                deviceUnitColor={device?.features?.unit_color}
                successText={<Translation id="TR_CONFIRMED_TX" />}
                onCancel={onCancel}
            />
            <Modal.ModalBase
                size="small"
                heading={
                    popupCall.method === 'ethereumSignTypedData' ? (
                        <Translation id="TR_SIGN_EIP712_TYPED_DATA" />
                    ) : (
                        <Translation id="TR_SIGN_MESSAGE" />
                    )
                }
                description={
                    <Row
                        columnGap={spacings.md}
                        rowGap={spacings.xxs}
                        flexWrap="wrap"
                        margin={{ top: spacings.xs }}
                    >
                        {network && (
                            <Row gap={spacings.xxs}>
                                <CoinLogo size={14} symbol={network.symbol} />
                                {account ? (
                                    <AccountLabel
                                        accountLabel={
                                            accountLabels[account.key] || account.accountLabel
                                        }
                                        accountType={account.accountType}
                                        symbol={account.symbol}
                                        index={account.index}
                                    />
                                ) : (
                                    network.name
                                )}
                            </Row>
                        )}
                        <ConnectCallSource />
                    </Row>
                }
            >
                <Column gap={spacings.xs}>
                    <Card
                        heading={
                            <Row gap={spacings.sm}>
                                <DotIndicator isActive={true} />
                                <H4 margin={{ left: spacings.xxs }} typographyStyle="callout">
                                    <Translation id="TR_MESSAGE" />
                                </H4>
                            </Row>
                        }
                        paddingType="small"
                    >
                        <Text
                            isMonospaced
                            as="pre"
                            margin={{ left: spacings.xxl }}
                            data-testid="@sign-message-modal/message"
                        >
                            {message}
                        </Text>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
