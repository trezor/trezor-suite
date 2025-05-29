import React, { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { getNetworkType } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    selectAccountByKey,
    selectNetworkFeeInfo,
    selectNetworkFeeLevelFeePerUnit,
    selectSendFormDraftByKey,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    TokenAddress,
} from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { SendFeesFormValues, sendFeesFormValidationSchema } from '../sendFeesFormSchema';
import { CustomFee } from './CustomFee';
import { FeeOptionsList } from './FeeOptionsList';
import { FeesFooter } from './FeesFooter';
import { RecipientsSummary } from './RecipientsSummary';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import {
    NativeSendRootState,
    selectDestinationTagFromDraft,
    selectFeeLevels,
} from '../sendFormSlice';
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

    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );
    const normalFee = feeLevels.normal as PrecomposedTransactionFinal; // user is not allowed to enter this screen if normal fee is not final

    const form = useForm<SendFeesFormValues>({
        validation: sendFeesFormValidationSchema,
        defaultValues: {
            feeLevel: formDraft?.selectedFee as NativeSupportedFeeLevel,
            customFeePerUnit: formDraft?.feePerUnit,
            customFeeLimit: normalFee?.feeLimit,
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

    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview({
        accountKey,
        tokenContract,
        transaction: selectedFeeLevelTransaction,
    });

    if (!account) return;

    const handleNavigateToReviewScreen = handleSubmit(() => {
        if (networkType === 'ripple' && destinationTag) {
            navigation.navigate(SendStackRoutes.SendDestinationTagReview, {
                destinationTag,
                accountKey,
                tokenContract,
                transaction: selectedFeeLevelTransaction,
            });
        } else if (networkType === 'stellar') {
            // The first review entry of Stellar is neither a destination address nor a destination tag.
            handleOnDeviceTransactionReview();

            navigation.navigate(SendStackRoutes.SendOutputsReview, {
                accountKey,
                tokenContract,
            });
        } else {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction: selectedFeeLevelTransaction,
            });
        }

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
                                    symbol={account.symbol}
                                    accountKey={accountKey}
                                    tokenContract={tokenContract}
                                />
                            )}
                            <CustomFee symbol={account.symbol} />
                        </VStack>
                    </VStack>
                    <FeesFooter
                        accountKey={accountKey}
                        isSubmittable={isSubmittable}
                        onSubmit={handleNavigateToReviewScreen}
                        totalAmount={selectedFeeLevelTransaction?.totalSpent ?? mockedTotalAmount}
                        fee={selectedFeeLevelTransaction?.fee ?? mockedFee}
                        symbol={account.symbol}
                        tokenContract={tokenContract}
                    />
                </VStack>
            </VStack>
        </Form>
    );
};
