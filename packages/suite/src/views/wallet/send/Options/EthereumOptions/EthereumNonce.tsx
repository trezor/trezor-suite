import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { getEthereumRbfFeeInfo, selectTransactions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import {
    fromWei,
    isEip1559,
    isInteger,
    isPending,
    isSentTransaction,
} from '@suite-common/wallet-utils';
import { Card, Column, H4, IconButton, Note, Row, TextButton } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
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
        formState: { errors },
        account,
        feeInfo,
        composeTransaction,
        changeFeeLevel,
        setValue,
    } = useSendFormContext();

    const locale = useSelector(selectLanguage);
    const transactions = useSelector(selectTransactions);
    const { translationString } = useTranslation();

    const nonceValue = useWatch({ name: 'ethereumNonce', control });
    // The nonce the fee bump was applied for; if the nonce changes the bump no longer applies.
    const [bumpedNonce, setBumpedNonce] = useState<string>();

    if (account.networkType !== 'ethereum') return null;

    const rules = {
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
    };

    const error = errors.ethereumNonce;

    // Non-blocking warnings (rules 2 & 3). Only computed for an otherwise-valid nonce so they never
    // overlap with the blocking error above.
    const getWarningType = (): 'gap' | 'replacement' | null => {
        if (error || !nonceValue || !isInteger(nonceValue)) return null;

        const value = new BigNumber(nonceValue);

        if (value.lt(0) || (confirmedNonce !== undefined && value.lt(confirmedNonce))) return null;

        if (displayNonce === undefined) return null;
        const next = new BigNumber(displayNonce);

        // Rule 2: a nonce above the next expected one leaves a gap; the tx stays pending until the
        // gap is filled.
        if (value.gt(next)) return 'gap';

        // Rule 3: a nonce in [confirmedNonce, nextNonce) lands on an existing pending tx, so this is
        // a replacement and needs a >= 10% bump on both fee fields to be accepted.
        if (value.lt(next)) return 'replacement';

        return null;
    };

    const warningType = getWarningType();

    // Bump the fee above the replaced pending tx (>= 1.2x) and write it into the editable custom fee
    // fields, so a nonce-replacement isn't rejected as "replacement transaction underpriced".
    // changeFeeLevel('custom') first populates feeLimit + base values; we then override the price.
    const applyFeeBump = () => {
        const replacedGas = (transactions[account.key] ?? [])
            .filter(isPending)
            .filter(isSentTransaction)
            .find(tx => tx.ethereumSpecific?.nonce === Number(nonceValue))?.ethereumSpecific;

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
                        icon="x"
                        size="small"
                        data-testid="send/close-transaction-data"
                        onClick={onCancel}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>

                <NumberInput
                    control={control}
                    name={'ethereumNonce' satisfies keyof FormState}
                    locale={locale}
                    hasError={!!error}
                    onChange={() => {
                        setBumpedNonce(undefined);
                        composeTransaction();
                    }}
                    rules={rules}
                    maxLength={formInputsMaxLength.ethereumNonce}
                    placeholder={displayNonce}
                    bottomText={error?.message || null}
                    data-testid="ethereum-nonce-input"
                />

                {warningType === 'gap' && (
                    <Note
                        iconName="warning"
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
                        <Note iconName="info" data-testid="@send/ethereum-nonce-replacement-info">
                            <Translation
                                id="ETHEREUM_NONCE_REPLACES_PENDING"
                                values={{ nonce: nonceValue }}
                            />
                        </Note>
                    ) : (
                        <Column gap={8} alignItems="flex-start">
                            <Note
                                iconName="warning"
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
