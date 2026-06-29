import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { zodResolver } from '@hookform/resolvers/zod';

import {
    type AccountsRootState,
    type NftSendFormValues,
    createNftSendFormSchema,
    selectAccountByKey,
    useNftFeeCompose,
    useNftSend,
} from '@suite-common/wallet-core';
import { NFT_MULTITOKEN_STANDARDS, findToken } from '@suite-common/wallet-utils';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

type NftSendStep = 'form' | 'review' | 'done';

export const NftSendScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.NftSend>) => {
    const { accountKey, tokenContract, tokenId } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const [step, setStep] = useState<NftSendStep>('form');
    const [formValues, setFormValues] = useState<NftSendFormValues | null>(null);

    const token = account ? findToken(account.tokens, tokenContract) : undefined;
    const isErc1155 = !!token && NFT_MULTITOKEN_STANDARDS.has(token.standard);
    const maxAmount = isErc1155
        ? Number(token.multiTokenValues?.find(v => v.id === tokenId)?.value ?? 1)
        : undefined;

    const schema = createNftSendFormSchema(maxAmount);

    const form = useForm({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            recipient: '' as `0x${string}`,
            amount: 1,
        },
    });

    const {
        watch,
        formState: { isValid },
    } = form;

    const recipient = watch('recipient') ?? ('' as `0x${string}`);
    const amount = Number(watch('amount') ?? 1);

    const { composedTransaction, composeRequest } = useNftFeeCompose({
        account: account!,
        tokenContract,
        tokenId,
        standard: token?.standard ?? 'ERC721',
        recipient: recipient || (account?.descriptor ?? ''),
        amount: amount || 1,
    });

    const { mutate: sendNft, isSuccess } = useNftSend({
        account: account!,
        token: token!,
        tokenId,
    });

    const onSubmitForm = (values: NftSendFormValues) => {
        setFormValues(values);
        composeRequest();
        setStep('review');
    };

    const onConfirm = () => {
        if (!formValues || !composedTransaction) return;
        sendNft(
            {
                recipient: formValues.recipient,
                amount: Number(formValues.amount),
                composedTransaction,
            },
            { onSuccess: () => setStep('done') },
        );
    };

    if (!account || !token) {
        return (
            <Screen>
                <Box padding="sp16">
                    <Translation id="generic.error.title" />
                </Box>
            </Screen>
        );
    }

    const collectionName = token?.name ?? token?.symbol ?? tokenContract;

    if (step === 'done' || isSuccess) {
        return (
            <Screen>
                <Box padding="sp16">
                    <Text variant="body-md-strong">
                        {collectionName} #{tokenId}
                    </Text>
                </Box>
            </Screen>
        );
    }

    if (step === 'review') {
        return (
            <Screen>
                <Box padding="sp16">
                    <VStack spacing="sp12">
                        <Text variant="body-md-strong">
                            {collectionName} #{tokenId}
                        </Text>
                        <Text variant="body-md">{formValues?.recipient}</Text>
                        {isErc1155 && <Text variant="body-md">{String(formValues?.amount)}</Text>}
                        <Text variant="body-md-strong" onPress={onConfirm}>
                            <Translation id="generic.buttons.confirm" />
                        </Text>
                    </VStack>
                </Box>
            </Screen>
        );
    }

    // form step
    return (
        <Screen>
            <Form form={form}>
                <Box padding="sp16">
                    <VStack spacing="sp12">
                        <Text variant="body-md-strong">
                            {collectionName} #{tokenId}
                        </Text>
                        <TextInputField
                            name="recipient"
                            label="Recipient address"
                            autoCapitalize="none"
                            onBlur={() => {
                                if (isValid) composeRequest();
                            }}
                        />
                        {isErc1155 && (
                            <TextInputField
                                name="amount"
                                label="Amount"
                                keyboardType="number-pad"
                            />
                        )}
                        <Text variant="body-md-strong" onPress={form.handleSubmit(onSubmitForm)}>
                            <Translation id="generic.buttons.continue" />
                        </Text>
                    </VStack>
                </Box>
            </Form>
        </Screen>
    );
};
