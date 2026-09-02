import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { getEthereumRbfFeeInfo, selectAccountTransactions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import {
    fromWei,
    getEvmNonceStatus,
    isEip1559,
    isInteger,
    isPending,
    isSignedByAccount,
} from '@suite-common/wallet-utils';
import { Card, Column, H4, IconButton, Input, Note, Row, TextButton } from '@trezor/components';
import { InfoIcon, WarningIcon, XIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

type EthereumNonceProps = {
    // The auto-resolved next available nonce (confirmed nonce advanced past contiguous pending txs).
    // Shown as the input placeholder and used to detect a nonce gap.
    displayNonce?: string;
    // The confirmed (mined-only) nonce — i.e. the count of confirmed txs. A custom nonce below this
    // has already been mined and would be rejected as "nonce too low".
    confirmedNonce?: string;
    // Clears the override and closes the input (the "cancel overriding" cross).
    onCancel: () => void;
};

export const EthereumNonce = ({ displayNonce, confirmedNonce, onCancel }: EthereumNonceProps) => {
    const {
        control,
        register,
        getDefaultValue,
        formState: { errors },
        account,
        feeInfo,
        composeTransaction,
        changeFeeLevel,
        setValue,
    } = useSendFormContext();

    const transactions = useSelector(state => selectAccountTransactions(state, account.key));
    const { translationString } = useTranslation();

    const nonceValue = useWatch({ name: 'ethereumNonce', control });
    // The nonce the fee bump was applied for; if the nonce changes the bump no longer applies.
    const [bumpedNonce, setBumpedNonce] = useState<string>();

    if (account.networkType !== 'ethereum') return null;

    const nonceFieldName = 'ethereumNonce' satisfies keyof FormState;

    // The custom nonce is an identifier, not a formatted amount, so unlike NumberInput this is a
    // plain uncontrolled Input (no locale-based thousands-separator formatting).
    const { ref: nonceRef, ...nonceField } = register(nonceFieldName, {
        onChange: () => {
            setBumpedNonce(undefined);
            composeTransaction();
        },
        validate: (value: string | undefined) => {
            if (!value) return;

            if (!isInteger(value)) {
                return translationString('ETHEREUM_NONCE_IS_NOT_INTEGER');
            }

            const nonceBig = new BigNumber(value);

            if (nonceBig.lt(0)) {
                return translationString('ETHEREUM_NONCE_IS_TOO_LOW');
            }

            // Rule 1: a nonce below the confirmed nonce is already mined -> guaranteed "nonce too
            // low" rejection, so block signing entirely.
            if (confirmedNonce !== undefined && nonceBig.lt(confirmedNonce)) {
                return translationString('ETHEREUM_NONCE_BELOW_CONFIRMED', {
                    nextNonce: displayNonce ?? confirmedNonce,
                });
            }
        },
    });

    const error = errors.ethereumNonce;

    const pendingSentTxs = transactions.filter(isPending).filter(isSignedByAccount);

    const pendingNonces = pendingSentTxs
        .map(tx => tx.ethereumSpecific?.nonce)
        .filter((nonce): nonce is number => typeof nonce === 'number');

    // Non-blocking warnings, computed only for an otherwise-valid nonce so they never overlap with
    // the blocking error above. Shares `getEvmNonceStatus` with the account's transaction list
    // (TransactionItem.tsx) so both agree on what counts as a gap vs. a replacement.
    const getWarningType = (): 'gap' | 'replacement' | null => {
        if (error || !nonceValue || !isInteger(nonceValue) || displayNonce === undefined)
            return null;

        const value = new BigNumber(nonceValue);
        if (value.lt(0)) return null;

        const status = getEvmNonceStatus(value.toNumber(), {
            confirmedNonce: confirmedNonce !== undefined ? Number(confirmedNonce) : 0,
            nextNonce: Number(displayNonce),
            pendingNonces,
        });

        return status === 'gap' || status === 'replacement' ? status : null;
    };

    const warningType = getWarningType();

    // Bump the fee above the replaced pending tx (>= 1.2x) and write it into the editable custom fee
    // fields, so a nonce-replacement isn't rejected as "replacement transaction underpriced".
    // changeFeeLevel('custom') first populates feeLimit + base values; we then override the price.
    const applyFeeBump = () => {
        const replacedGas = pendingSentTxs.find(
            tx => tx.ethereumSpecific?.nonce === Number(nonceValue),
        )?.ethereumSpecific;

        // The pending tx may have been confirmed between form-open and clicking "Apply fee bump"
        // (stale displayNonce props). Guard here so we don't silently bump from zero.
        if (!replacedGas) return;

        const bumpedLevel = getEthereumRbfFeeInfo(feeInfo, {
            gasPrice: replacedGas.gasPrice ? fromWei(replacedGas.gasPrice).toGwei() : undefined,
            maxFeePerGas: replacedGas.maxFeePerGas
                ? fromWei(replacedGas.maxFeePerGas).toGwei()
                : undefined,
            maxPriorityFeePerGas: replacedGas.maxPriorityFeePerGas
                ? fromWei(replacedGas.maxPriorityFeePerGas).toGwei()
                : undefined,
        }).levels[0];

        changeFeeLevel('custom');

        if (bumpedLevel) {
            if (isEip1559(bumpedLevel)) {
                setValue('maxFeePerGas', bumpedLevel.maxFeePerGas);
                setValue('maxPriorityFeePerGas', bumpedLevel.maxPriorityFeePerGas);
            } else {
                setValue('feePerUnit', bumpedLevel.feePerUnit);
            }
        }

        composeTransaction();
        setBumpedNonce(nonceValue);
    };

    const isFeeBumpApplied = bumpedNonce !== undefined && bumpedNonce === nonceValue;

    return (
        <Card>
            <Column gap={12}>
                <Row justifyContent="space-between">
                    <H4 typographyStyle="body-md">
                        <Translation id="TR_NONCE" />
                    </H4>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon={XIcon}
                        size="small"
                        data-testid="send/close-transaction-data"
                        onClick={onCancel}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>

                <Input
                    innerRef={nonceRef}
                    {...nonceField}
                    defaultValue={getDefaultValue(nonceFieldName) || ''}
                    inputMode="numeric"
                    hasError={!!error}
                    maxLength={formInputsMaxLength.ethereumNonce}
                    placeholder={displayNonce}
                    bottomText={error?.message || null}
                    data-testid="ethereum-nonce-input"
                />

                {warningType === 'gap' && (
                    <Note
                        icon={WarningIcon}
                        intent="warning"
                        data-testid="@send/ethereum-nonce-warning"
                    >
                        <Translation
                            id="ETHEREUM_NONCE_GAP_WARNING"
                            values={{ nextNonce: displayNonce }}
                        />
                    </Note>
                )}

                {warningType === 'replacement' &&
                    (isFeeBumpApplied ? (
                        <Note icon={InfoIcon} data-testid="@send/ethereum-nonce-replacement-info">
                            <Translation
                                id="ETHEREUM_NONCE_REPLACES_PENDING"
                                values={{ nonce: nonceValue }}
                            />
                        </Note>
                    ) : (
                        <Column gap={8} alignItems="flex-start">
                            <Note
                                icon={WarningIcon}
                                intent="warning"
                                data-testid="@send/ethereum-nonce-warning"
                            >
                                <Translation id="ETHEREUM_NONCE_REPLACEMENT_WARNING" />
                            </Note>
                            <TextButton
                                size="small"
                                onClick={applyFeeBump}
                                data-testid="send/apply-nonce-fee-bump"
                            >
                                <Translation id="ETHEREUM_NONCE_APPLY_FEE_BUMP" />
                            </TextButton>
                        </Column>
                    ))}
            </Column>
        </Card>
    );
};
