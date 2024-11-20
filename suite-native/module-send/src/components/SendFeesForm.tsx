import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import { useNavigation } from '@react-navigation/native';

import { VStack, Text } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    TokenAddress,
} from '@suite-common/wallet-types';
import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectNetworkFeeInfo,
    selectNetworkFeeLevelFeePerUnit,
    selectSendFormDraftByKey,
    SendRootState,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { getNetworkType } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

import { SendFeesFormValues, sendFeesFormValidationSchema } from '../sendFeesFormSchema';
import { FeesFooter } from './FeesFooter';
import { FeeOptionsList } from './FeeOptionsList';
import { RecipientsSummary } from './RecipientsSummary';
import { CustomFee } from './CustomFee';
import { selectFeeLevels } from '../sendFormSlice';
import { NativeSupportedFeeLevel } from '../types';

type SendFormProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type SendFeesNavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendFees,
    RootStackParamList
>;

export const SendFeesForm = ({ accountKey, tokenContract }: SendFormProps) => {
    const navigation = useNavigation<SendFeesNavigationProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector(selectFeeLevels);

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );

    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    const networkType = account?.symbol ? getNetworkType(account.symbol) : undefined;

    const minimalFeeLimit =
        'estimatedFeeLimit' in feeLevels.normal ? feeLevels.normal.estimatedFeeLimit : undefined;

    const form = useForm<SendFeesFormValues>({
        validation: sendFeesFormValidationSchema,
        defaultValues: {
            feeLevel: formDraft?.selectedFee as NativeSupportedFeeLevel,
            customFeePerUnit: formDraft?.feePerUnit,
            customFeeLimit: formDraft?.feeLimit,
        },
        context: {
            networkFeeInfo,
            networkType,
            minimalFeeLimit,
        },
    });
    const { handleSubmit, control } = form;

    const selectedFeeLevel = useWatch({ control, name: 'feeLevel' });
    const selectedFeeLevelTransaction = feeLevels[
        selectedFeeLevel
    ] as GeneralPrecomposedTransactionFinal;

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelFeePerUnit(state, account?.symbol, selectedFeeLevel),
    );

    const normalFee = feeLevels.normal as PrecomposedTransactionFinal; // user is not allowed to enter this screen if normal fee is not final
    const transactionBytes = normalFee.bytes as number;

    // If trezor-connect was not able to compose the fee level, we have calculate total amount locally.
    const mockedFee = useMemo(
        () =>
            BigNumber(transactionBytes)
                .times(feePerUnit ?? normalFee.feePerByte)
                .toString(),
        [transactionBytes, feePerUnit, normalFee.feePerByte],
    );

    const mockedTotalAmount = useMemo(
        () => BigNumber(normalFee.totalSpent).minus(normalFee.fee).plus(mockedFee).toString(),
        [normalFee, mockedFee],
    );

    if (!account) return;

    const handleNavigateToReviewScreen = handleSubmit(() => {
        navigation.navigate(SendStackRoutes.SendAddressReview, {
            accountKey,
            tokenContract,
            transaction: selectedFeeLevelTransaction,
        });

        // In case that view only device is not connected, show connect screen first.
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
            params: {
                // If user cancels, navigate back to the send fees screen.
                onCancelNavigationTarget: {
                    name: RootStackRoutes.SendStack,
                    params: {
                        screen: SendStackRoutes.SendFees,
                        params: { accountKey, tokenContract },
                    },
                },
            },
        });
    });

    const isSubmittable = selectedFeeLevelTransaction?.type === 'final';

    return (
        <Form form={form}>
            <VStack spacing="sp32" flex={1}>
                <RecipientsSummary
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    selectedFeeLevel={selectedFeeLevelTransaction}
                />
                <VStack flex={1} justifyContent="space-between" spacing="sp24">
                    <VStack spacing="sp16">
                        <VStack spacing="sp4">
                            <Text variant="titleSmall">
                                <Translation id="moduleSend.fees.description.title" />
                            </Text>
                            <Text>
                                <Translation id="moduleSend.fees.description.body" />
                            </Text>
                        </VStack>
                        <VStack spacing="sp24">
                            {selectedFeeLevel !== 'custom' && (
                                <FeeOptionsList
                                    feeLevels={feeLevels}
                                    networkSymbol={account.symbol}
                                    accountKey={accountKey}
                                    tokenContract={tokenContract}
                                />
                            )}
                            <CustomFee />
                        </VStack>
                    </VStack>
                    <FeesFooter
                        accountKey={accountKey}
                        isSubmittable={isSubmittable}
                        onSubmit={handleNavigateToReviewScreen}
                        totalAmount={selectedFeeLevelTransaction?.totalSpent ?? mockedTotalAmount}
                        fee={selectedFeeLevelTransaction?.fee ?? mockedFee}
                        networkSymbol={account.symbol}
                        tokenContract={tokenContract}
                    />
                </VStack>
            </VStack>
        </Form>
    );
};
