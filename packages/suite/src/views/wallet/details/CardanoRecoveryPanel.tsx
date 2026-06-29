import { type ReactNode, useState } from 'react';

import { Address } from '@suite/address';
import { useDevice } from '@suite/device';
import { openModal } from '@suite/modal';
import { showAddressThunk } from '@suite/receive';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import {
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import { Banner, Button, Card, Column, Input, Row, Text } from '@trezor/components';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import {
    cardanoRecoverySignThunk,
    getCardanoAccountLevelPath,
} from 'src/actions/wallet/cardanoRecoveryActions';
import { useDispatch } from 'src/hooks/suite';

type RecoveryRowProps = {
    title: string;
    description: string;
    children: ReactNode;
};

const RecoveryRow = ({ title, description, children }: RecoveryRowProps) => (
    <Row justifyContent="space-between" alignItems="center" gap={spacings.lg}>
        <Column gap={spacings.xxs} alignItems="flex-start">
            <Text typographyStyle="body-md">{title}</Text>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {description}
            </Text>
        </Column>
        {children}
    </Row>
);

type RecoveryAddressFieldProps = {
    address?: string;
    placeholder: string;
    action: ReactNode;
};

const RecoveryAddressField = ({ address, placeholder, action }: RecoveryAddressFieldProps) => (
    <Row gap={spacings.md} alignItems="center">
        <Card paddingType="small" type="sunken" flex="1">
            {address ? (
                <Address value={address} isChunked={false} isCopyAllowed />
            ) : (
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    {placeholder}
                </Text>
            )}
        </Card>
        {action}
    </Row>
);

type CardanoRecoveryPanelProps = {
    account: Account;
};

export const CardanoRecoveryPanel = ({ account }: CardanoRecoveryPanelProps) => {
    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();
    const [address, setAddress] = useState('');
    const [utxoTxid, setUtxoTxid] = useState('');
    const [utxoAmount, setUtxoAmount] = useState('');
    const [txid, setTxid] = useState<string>();
    const [isDeriving, setIsDeriving] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isDestinationRevealed, setIsDestinationRevealed] = useState(false);

    const accountLevelPath = getCardanoAccountLevelPath(account.index);
    const isDeviceLocked = isLocked();
    const safetyChecks = device?.features?.safety_checks;
    const isSafetyChecksStrict = safetyChecks === 'Strict';
    const destinationAddress = account.addresses?.unused[0] ?? account.addresses?.used[0];
    const isRecoverDisabled =
        isDeviceLocked ||
        isSafetyChecksStrict ||
        !isDestinationRevealed ||
        address === '' ||
        utxoTxid === '' ||
        utxoAmount === '';

    const showError = (error: string) =>
        dispatch(notificationsActions.addToast({ type: 'error', error }));

    const handleDerive = async () => {
        setIsDeriving(true);
        const response = await TrezorConnect.cardanoGetAddress({
            device,
            addressParameters: {
                addressType: PROTO.CardanoAddressType.BASE,
                path: accountLevelPath,
                stakingPath: getStakingPath(account),
            },
            protocolMagic: getProtocolMagic(account.symbol),
            networkId: getNetworkId(),
            derivationType: getDerivationType(account.accountType),
            showOnTrezor: false,
        });
        setIsDeriving(false);

        if (response.success) {
            setAddress(response.payload.address);
        } else {
            showError(response.error.message);
        }
    };

    const handleReveal = () => {
        if (!destinationAddress) return;

        setIsDestinationRevealed(true);
        dispatch(
            showAddressThunk({
                path: destinationAddress.path,
                address: destinationAddress.address,
            }),
        );
    };

    const handleRecover = async () => {
        setIsRecovering(true);
        setTxid(undefined);
        try {
            const result = await dispatch(
                cardanoRecoverySignThunk({
                    accountKey: account.key,
                    sourceAddress: address,
                    utxo: {
                        txid: utxoTxid.trim(),
                        vout: 0,
                        amount: utxoAmount.trim(),
                    },
                    accountLevelPath,
                }),
            ).unwrap();
            setTxid(result.txid);
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: result.txid,
                }),
            );
        } catch (error) {
            showError(typeof error === 'string' ? error : 'Recovery failed.');
        }
        setIsRecovering(false);
    };

    return (
        <Card>
            <Column gap={spacings.lg} alignItems="stretch">
                <Text typographyStyle="headline-sm">
                    Base derivation recovery ({accountLevelPath})
                </Text>

                <RecoveryRow
                    title="Device safety checks"
                    description="Signing the non-standard recovery path requires safety checks to be set to Prompt."
                >
                    {isSafetyChecksStrict ? (
                        <Column gap={spacings.xs} alignItems="flex-end">
                            <Text typographyStyle="body-md" intent="critical">
                                ON
                            </Text>
                            <Button
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                onClick={() => dispatch(openModal({ type: 'safety-checks' }))}
                            >
                                Set safety checks
                            </Button>
                        </Column>
                    ) : (
                        <Text
                            typographyStyle="body-md"
                            intent={safetyChecks ? 'brand' : 'neutral'}
                            priority={safetyChecks ? 'primary' : 'secondary'}
                        >
                            {safetyChecks ? 'OFF' : 'Unknown'}
                        </Text>
                    )}
                </RecoveryRow>

                <Column gap={spacings.sm} alignItems="stretch">
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <Text typographyStyle="body-md">Account-level address</Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Derive the base address and verify it matches the funds on Cexplorer.
                        </Text>
                    </Column>
                    <RecoveryAddressField
                        address={address}
                        placeholder="Derive to reveal the account-level base address."
                        action={
                            <Button
                                intent="brand"
                                priority="primary"
                                size="small"
                                onClick={handleDerive}
                                isDisabled={isDeviceLocked || isSafetyChecksStrict}
                                isLoading={isDeriving}
                            >
                                Derive base address
                            </Button>
                        }
                    />
                    {address !== '' && (
                        <Button
                            href={`https://cexplorer.io/address/${address}?tab=utxos`}
                            target="_blank"
                            intent="neutral"
                            priority="secondary"
                            size="small"
                        >
                            View UTXOs on Cexplorer
                        </Button>
                    )}
                </Column>

                <Column gap={spacings.sm} alignItems="stretch">
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <Text typographyStyle="body-md">UTXO to recover</Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            From the Cexplorer UTXOs tab, copy the transaction hash and amount. Only
                            UTXOs at index 0 are supported.
                        </Text>
                    </Column>
                    <Row gap={spacings.sm} alignItems="flex-start">
                        <Input
                            label="Transaction hash"
                            value={utxoTxid}
                            onChange={event => setUtxoTxid(event.target.value)}
                            flex="3"
                        />
                        <Input
                            label="Amount (lovelace)"
                            value={utxoAmount}
                            onChange={event => setUtxoAmount(event.target.value)}
                            flex="1"
                        />
                    </Row>
                </Column>

                <Column gap={spacings.sm} alignItems="stretch">
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <Text typographyStyle="body-md">Recover funds</Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Reveal the standard fresh address of this account to verify it on your
                            device, then recover the funds to it.
                        </Text>
                    </Column>
                    <RecoveryAddressField
                        address={isDestinationRevealed ? destinationAddress?.address : undefined}
                        placeholder="Reveal the standard address to verify it on your device."
                        action={
                            <Row gap={spacings.sm} alignItems="center">
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    size="small"
                                    onClick={handleReveal}
                                    isDisabled={isDeviceLocked || destinationAddress === undefined}
                                >
                                    Reveal
                                </Button>
                                <Button
                                    intent="brand"
                                    priority="primary"
                                    size="small"
                                    onClick={handleRecover}
                                    isDisabled={isRecoverDisabled}
                                    isLoading={isRecovering}
                                >
                                    Recover
                                </Button>
                            </Row>
                        }
                    />
                    {txid !== undefined && (
                        <Banner
                            intent="brand"
                            icon
                            rightContent={
                                <Banner.Button
                                    href={`https://cexplorer.io/tx/${txid}`}
                                    target="_blank"
                                >
                                    View tx on Cexplorer
                                </Banner.Button>
                            }
                            description="Recovery transaction broadcast successfully."
                        />
                    )}
                </Column>
            </Column>
        </Card>
    );
};
