import { useState } from 'react';
import { Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { closeModal as closeModalAction } from '@suite/modal';
import { Translation } from '@suite/intl';
import {
    createNftSendFormSchema,
    type NftSendFormValues,
    useNftFeeCompose,
    useNftSend,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    NFT_MULTITOKEN_STANDARDS,
    NFT_SINGLETOKEN_STANDARDS,
    findToken,
} from '@suite-common/wallet-utils';
import { Button, Column, Input, Modal, Row, Text } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';

type NftSendStep = 'form' | 'review' | 'done';

type NftSendModalProps = {
    account: Account;
    tokenContract: string;
    tokenId: string;
};

export const NftSendModal = ({ account, tokenContract, tokenId }: NftSendModalProps) => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<NftSendStep>('form');
    const [formValues, setFormValues] = useState<NftSendFormValues | null>(null);

    const token = findToken(account.tokens, tokenContract);
    const isErc1155 = !!token && NFT_MULTITOKEN_STANDARDS.has(token.standard);
    const maxAmount = isErc1155
        ? Number(
              token.multiTokenValues?.find(v => v.id === tokenId)?.value ?? 1,
          )
        : undefined;

    const schema = createNftSendFormSchema(maxAmount);

    const { handleSubmit, control, watch, formState: { errors, isValid } } = useForm<NftSendFormValues>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            recipient: '',
            amount: isErc1155 ? (1 as any) : (1 as any),
        },
    });

    const recipient = watch('recipient') ?? '';
    const amount = Number(watch('amount') ?? 1);

    const {
        feeInfo,
        isComposing,
        composedTransaction,
        composedLevels,
        selectedFee,
        composeRequest,
        changeFeeLevel,
        methods: feeMethods,
    } = useNftFeeCompose({
        account,
        tokenContract,
        tokenId,
        standard: token?.standard ?? 'ERC721',
        recipient: recipient || account.descriptor,
        amount: amount || 1,
    });

    const {
        mutate: sendNft,
        isPending: isSending,
        isSuccess,
        error: sendError,
        reset: resetSend,
    } = useNftSend({ account, token: token!, tokenId });

    const onClose = () => dispatch(closeModalAction());

    const onSubmitForm = (values: NftSendFormValues) => {
        setFormValues(values);
        composeRequest();
        setStep('review');
    };

    const onConfirm = () => {
        if (!formValues || !composedTransaction) return;
        sendNft(
            { recipient: formValues.recipient, amount: Number(formValues.amount), composedTransaction },
            { onSuccess: () => setStep('done') },
        );
    };

    const collectionName = token?.name ?? token?.symbol ?? tokenContract;

    if (!token) {
        return (
            <Modal heading="NFT Send" onCancel={onClose}>
                <Text>Token not found in account.</Text>
            </Modal>
        );
    }

    if (step === 'done' || isSuccess) {
        return (
            <Modal heading={<Translation id="TR_NFT_COLLECTION" />} onCancel={onClose}>
                <Column gap={16} alignItems="center">
                    <Text typographyStyle="titleLarge">✓</Text>
                    <Text>
                        {collectionName} #{tokenId} <Translation id="TR_SENT" />
                    </Text>
                    <Button onClick={onClose}>
                        <Translation id="TR_CLOSE" />
                    </Button>
                </Column>
            </Modal>
        );
    }

    if (step === 'review') {
        return (
            <Modal
                heading={<Translation id="TR_NFT_TOKEN_ID" />}
                onBackClick={() => { resetSend(); setStep('form'); }}
                onCancel={onClose}
            >
                <Column gap={16}>
                    <Row justifyContent="space-between">
                        <Text priority="secondary"><Translation id="TR_NFT_COLLECTION" /></Text>
                        <Text>{collectionName} #{tokenId}</Text>
                    </Row>
                    <Row justifyContent="space-between">
                        <Text priority="secondary"><Translation id="TR_RECIPIENT_ADDRESS" /></Text>
                        <Text>{formValues?.recipient}</Text>
                    </Row>
                    {isErc1155 && (
                        <Row justifyContent="space-between">
                            <Text priority="secondary"><Translation id="AMOUNT" /></Text>
                            <Text>{formValues?.amount}</Text>
                        </Row>
                    )}
                    <FormProvider {...feeMethods}>
                        <Fees
                            account={account}
                            feeInfo={feeInfo}
                            composedLevels={composedLevels}
                            changeFeeLevel={changeFeeLevel}
                        />
                    </FormProvider>
                    {sendError && (
                        <Text intent="critical">{String(sendError)}</Text>
                    )}
                    <Button
                        onClick={onConfirm}
                        isLoading={isSending || isComposing}
                        isDisabled={!composedTransaction || isSending}
                    >
                        <Translation id="TR_CONFIRM_ON_TREZOR" />
                    </Button>
                </Column>
            </Modal>
        );
    }

    // step === 'form'
    return (
        <Modal heading={<Translation id="TR_NFT_COLLECTION" />} onCancel={onClose}>
            <Column gap={16}>
                <Text priority="secondary">
                    {collectionName} #{tokenId}
                </Text>
                <Controller
                    control={control}
                    name="recipient"
                    render={({ field }) => (
                        <Input
                            {...field}
                            label={<Translation id="TR_RECIPIENT_ADDRESS" />}
                            bottomText={errors.recipient?.message ?? null}
                            hasError={!!errors.recipient}
                            onBlur={() => { if (isValid) composeRequest(); }}
                        />
                    )}
                />
                {isErc1155 && (
                    <Controller
                        control={control}
                        name="amount"
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={String(field.value ?? '')}
                                label={<Translation id="AMOUNT" />}
                                bottomText={errors.amount?.message ?? null}
                                hasError={!!errors.amount}
                            />
                        )}
                    />
                )}
                <Button
                    onClick={handleSubmit(onSubmitForm)}
                    isDisabled={!isValid}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            </Column>
        </Modal>
    );
};
