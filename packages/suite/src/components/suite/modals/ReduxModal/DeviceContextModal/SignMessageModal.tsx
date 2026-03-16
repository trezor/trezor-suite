import styled from 'styled-components';

import { Translation } from '@suite/intl';
import type { DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkByEvmChainId,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAddressByNetworkAndPath,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { findAccountsByAddress } from '@suite-common/wallet-utils';
import { Card, Column, DotIndicator, H4, Modal, Row } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { CoinLogo, ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { useSelector } from 'src/hooks/suite';

const MessageText = styled.pre`
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    margin-left: ${spacingsPx.xxl};
`;

interface SignMessageModalProps {
    device: TrezorDevice;
    message: string;
    coin?: string;
    serializedPath?: string;
}

export const simplifyJSON = (object: any) =>
    JSON.stringify(object, null, 2)
        .replace(/[{}",[\]]/g, '')
        .replace(/^\s{2}/gm, '')
        .replace(/\n\s*\n/gm, '\n')
        .trim();

export const SignMessageModal = ({
    device,
    message,
    coin,
    serializedPath,
}: SignMessageModalProps) => {
    const accounts = useSelector(selectDeviceAccounts);
    const deviceModelInternal = device.features?.internal_model;

    const onCancel = () => {
        TrezorConnect.cancel();
    };

    // Connect's coin shortcut (uppercase) <-> Suite's network symbol (lowercase)
    const networkSymbol = coin?.toLowerCase() as NetworkSymbol;
    const eip712parsed = () => {
        try {
            return JSON.parse(message);
        } catch {
            return undefined;
        }
    };
    const isEip712 =
        eip712parsed()?.primaryType && eip712parsed()?.domain && eip712parsed()?.message;
    const eip712ChainId = eip712parsed()?.domain?.chainId;
    const network = eip712ChainId
        ? getNetworkByEvmChainId(eip712ChainId)
        : getNetwork(networkSymbol ?? 'eth');

    const address = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectAddressByNetworkAndPath(state, network, serializedPath),
    );
    const account =
        network && address
            ? findAccountsByAddress(network.symbol, address, accounts)[0]
            : undefined;

    return (
        <ConnectModalBackdrop onClick={onCancel} canSwitchDevice>
            <ConfirmOnDevicePill
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={deviceModelInternal}
                deviceUnitColor={device?.features?.unit_color}
                successText={<Translation id="TR_CONFIRMED_TX" />}
                onCancel={onCancel}
            />
            <Modal.ModalBase
                width={600}
                heading={
                    isEip712 ? (
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
                                        account={account}
                                        showAccountTypeBadge
                                        accountTypeBadgeSize="small"
                                    />
                                ) : (
                                    network.name
                                )}
                            </Row>
                        )}
                        <ConnectCallSource />
                    </Row>
                }
                onCancel={onCancel}
            >
                <Column gap={spacings.xs}>
                    {address && (
                        <Card
                            header={
                                <Row gap={spacings.sm}>
                                    <DotIndicator isActive={device.buttonRequests.length === 1} />
                                    <H4
                                        margin={{ left: spacings.xxs }}
                                        typographyStyle="body-sm-strong"
                                    >
                                        <Translation id="TR_ADDRESS" />
                                    </H4>
                                </Row>
                            }
                            paddingType="small"
                        >
                            <MessageText data-testid="@sign-message-modal/address">
                                {address}
                            </MessageText>
                        </Card>
                    )}
                    {isEip712 && (
                        <Card
                            header={
                                <Row gap={spacings.sm}>
                                    <DotIndicator isActive={device.buttonRequests.length === 2} />
                                    <H4
                                        margin={{ left: spacings.xxs }}
                                        typographyStyle="body-sm-strong"
                                    >
                                        <Translation id="TR_DOMAIN" />
                                    </H4>
                                </Row>
                            }
                            paddingType="small"
                        >
                            <MessageText data-testid="@sign-message-modal/domain">
                                {simplifyJSON(eip712parsed()?.domain)}
                            </MessageText>
                        </Card>
                    )}
                    <Card
                        header={
                            <Row gap={spacings.sm}>
                                <DotIndicator
                                    isActive={device.buttonRequests.length === (isEip712 ? 3 : 2)}
                                />
                                <H4
                                    margin={{ left: spacings.xxs }}
                                    typographyStyle="body-sm-strong"
                                >
                                    <Translation id="TR_MESSAGE" />
                                </H4>
                            </Row>
                        }
                        paddingType="small"
                    >
                        <MessageText data-testid="@sign-message-modal/message">
                            {isEip712 ? simplifyJSON(eip712parsed()?.message) : message}
                        </MessageText>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
