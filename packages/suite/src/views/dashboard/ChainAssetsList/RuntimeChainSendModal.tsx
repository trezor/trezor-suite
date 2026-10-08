import { useMemo, useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    useChainAccountBalance,
    useChainComposeFeeLevels,
    useChainFeeInfo,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import type { Account, GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { Banner, Checkbox, Column, Input, Modal, SelectBar, Text } from '@trezor/components';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import { convertAmountSubunitsToUnits } from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import {
    type RuntimeChainFeeLevel,
    type RuntimeChainSendComposed,
    checkRuntimeAmount,
    checkRuntimeRecipient,
    createRuntimeChainSendDraft,
    toRuntimeChainSendAccount,
    withSignedAmount,
} from 'src/support/runtimeEvmNetworks/runtimeChainSend';

type RuntimeChainSendModalProps = {
    definition: RuntimeEvmNetworkDefinition;

    /** The wallet account whose address the runtime network is read at. */
    walletAccount: Account;
    onComposed: (composed: RuntimeChainSendComposed) => void;
    onCancel: () => void;
};

// Runtime EVM networks are a debug feature; its texts are not translated yet.
const FEE_LEVEL_OPTIONS: { label: string; value: RuntimeChainFeeLevel }[] = [
    { label: 'Normal', value: 'normal' },
    { label: 'High', value: 'high' },
];

type ComposeErrorProps = { level: GeneralPrecomposedTransaction };

const ComposeError = ({ level }: ComposeErrorProps) => {
    if (level.type !== 'error') return null;

    return (
        <Text intent="critical" data-testid="@runtime-chain-send/compose-error">
            {level.errorMessage ? (
                <Translation
                    id={level.errorMessage.id as TranslationKey}
                    values={level.errorMessage.values}
                />
            ) : (
                `The transaction cannot be composed (${level.error}).`
            )}
        </Text>
    );
};

/**
 * Composes a native coin send on a runtime network from a wallet account's address, and hands
 * over what to sign. The caller closes it and signs: the device's prompts open their own modal.
 */
export const RuntimeChainSendModal = ({
    definition,
    walletAccount,
    onComposed,
    onCancel,
}: RuntimeChainSendModalProps) => {
    const network = useSelectedChainNetworks().find(
        chainNetwork => chainNetwork.symbol === definition.symbol,
    );

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isMax, setIsMax] = useState(false);
    const [selectedFee, setSelectedFee] = useState<RuntimeChainFeeLevel>('normal');

    const ref = useMemo(
        () => ({
            symbol: definition.symbol,
            descriptor: walletAccount.descriptor,
            accountType: walletAccount.accountType,
        }),
        [definition, walletAccount],
    );
    const { data: balance } = useChainAccountBalance({ network, ref, enabled: true });
    const { data: feeInfo, isError: isFeeInfoError } = useChainFeeInfo({
        network,
        enabled: true,
    });

    const account = useMemo(
        () =>
            balance
                ? toRuntimeChainSendAccount(walletAccount, definition, balance.availableBalance)
                : undefined,
        [balance, definition, walletAccount],
    );

    const recipientCheck = recipient ? checkRuntimeRecipient(recipient) : undefined;
    const recipientAddress =
        recipientCheck && 'address' in recipientCheck ? recipientCheck.address : undefined;
    const amountError =
        isMax || !amount ? undefined : checkRuntimeAmount(amount, definition.decimals);

    const draft = useMemo(
        () =>
            recipientAddress && (isMax || (amount && !amountError))
                ? createRuntimeChainSendDraft({
                      address: recipientAddress,
                      amount,
                      isMax,
                      selectedFee,
                  })
                : undefined,
        [amount, amountError, isMax, recipientAddress, selectedFee],
    );
    const context = useMemo(() => (feeInfo ? { feeInfo } : undefined), [feeInfo]);

    const composed = useChainComposeFeeLevels({
        network,
        account,
        draft,
        context,
        enabled: true,
    });
    const level = composed.data?.[selectedFee];
    const finalLevel = level?.type === 'final' ? level : undefined;

    if (!network) return null;

    // Validated definitions only hold well-formed node URLs.
    const rpcHosts = definition.rpcUrls.map(url => new URL(url).host).join(', ');

    const fee = finalLevel ? convertAmountSubunitsToUnits(finalLevel.fee, definition.decimals) : '';
    const signedAmount = isMax ? (finalLevel?.max ?? '') : amount;
    const isFeeAboveAmount = !!finalLevel && new BigNumber(fee).gt(signedAmount || 0);

    const handleContinue = () => {
        if (!draft || !finalLevel) return;
        onComposed({
            formState: withSignedAmount(draft, signedAmount),
            precomposedTransaction: finalLevel,
        });
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={`Send ${definition.nativeSymbol} on ${definition.name}`}
            bottomContent={
                <Modal.Button
                    onClick={handleContinue}
                    isDisabled={!finalLevel}
                    isLoading={composed.isFetching}
                    data-testid="@runtime-chain-send/continue"
                >
                    Review on device
                </Modal.Button>
            }
        >
            <Column gap={16} alignItems="stretch">
                <Banner
                    intent={definition.source === 'user' ? 'warning' : 'info'}
                    description={
                        `Your Trezor will show chain ${definition.chainId} as an unknown network. ` +
                        (definition.source === 'user'
                            ? `You added this network: Trezor checked neither it nor its node at ${rpcHosts}.`
                            : 'Trezor listed this network; it is not built into the app.')
                    }
                />
                <Text typographyStyle="body-sm" priority="secondary">
                    {`Available: ${balance?.availableBalance ?? '…'} ${definition.nativeSymbol}`}
                </Text>
                <Input
                    label="Recipient"
                    value={recipient}
                    onChange={event => setRecipient(event.target.value)}
                    hasError={!!recipientCheck && 'error' in recipientCheck}
                    bottomText={
                        recipientCheck && 'error' in recipientCheck ? recipientCheck.error : null
                    }
                    data-testid="@runtime-chain-send/recipient"
                />
                <Input
                    label={`Amount (${definition.nativeSymbol})`}
                    value={isMax ? (finalLevel?.max ?? '') : amount}
                    isDisabled={isMax}
                    onChange={event => setAmount(event.target.value.trim())}
                    hasError={!!amountError}
                    bottomText={amountError ?? null}
                    data-testid="@runtime-chain-send/amount"
                />
                <Checkbox isChecked={isMax} onChange={() => setIsMax(current => !current)}>
                    Send max
                </Checkbox>
                <SelectBar
                    label="Fee"
                    options={FEE_LEVEL_OPTIONS}
                    selectedOption={selectedFee}
                    onChange={setSelectedFee}
                />
                {isFeeInfoError && (
                    <Text intent="critical">The network&apos;s node quotes no fees right now.</Text>
                )}
                {level && <ComposeError level={level} />}
                {finalLevel && (
                    <Text typographyStyle="body-sm" data-testid="@runtime-chain-send/fee">
                        {`Max fee: ${fee} ${definition.nativeSymbol} (gas limit ${finalLevel.feeLimit ?? '?'})`}
                    </Text>
                )}
                {isFeeAboveAmount && (
                    <Banner
                        intent="warning"
                        description="The fee is higher than the amount you send."
                    />
                )}
            </Column>
        </Modal>
    );
};
