import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type SendRootState, selectSendFormDraftByKey } from '@suite-common/wallet-core';
import { type AccountKey, type FeeLevelLabel, type TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import {
    FeesContent,
    FeesFooter,
    type NativeSendRootState,
    useFeesManagement,
} from '@suite-native/transaction-management';

import { RecipientsSummary } from './RecipientsSummary';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import { useRequestDelayedNavigationToOutputsReview } from '../hooks/useRequestDelayedNavigationToOutputsReview';
import { selectDestinationTagFromDraft } from '../selectors';

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

    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );

    const {
        form,
        selectedFeeLevel,
        selectedFeeLevelTransaction,
        totalAmount,
        fee,
        isSubmittable,
        areFeesLoading,
        symbol,
        account,
        feeLevels,
        handleFeeLevelChange,
        handleCustomFeeSet,
    } = useFeesManagement({
        accountKey,
        tokenContract,
        updateThunk: updateSelectedFeeLevelThunk,
        selectedFee: formDraft?.selectedFee as FeeLevelLabel,
        selectedFeePerUnit: formDraft?.feePerUnit,
        selectedSetMaxOutputId: formDraft?.setMaxOutputId,
    });

    const { networkType } = account ?? {};
    const { handleSubmit } = form;

    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview({
        accountKey,
        tokenContract,
        transaction: selectedFeeLevelTransaction,
    });

    const requestDelayedNavigationToOutputsReview = useRequestDelayedNavigationToOutputsReview({
        accountKey,
        tokenContract,
    });

    const handleNavigateToReviewScreen = handleSubmit(() => {
        if (!selectedFeeLevelTransaction) {
            return;
        }

        if (networkType === 'ripple' && destinationTag) {
            navigation.navigate(SendStackRoutes.SendDestinationTagReview, {
                destinationTag,
                accountKey,
                tokenContract,
                transaction: selectedFeeLevelTransaction,
            });
        } else if (networkType === 'stellar') {
            // The first review entry of Stellar is neither a destination address nor a destination tag.
            // We need to wait for device button requests before navigating to the review screen.
            handleOnDeviceTransactionReview();
            requestDelayedNavigationToOutputsReview();
        } else {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction: selectedFeeLevelTransaction,
            });
        }

        // In case that view only device is not connected, show connect screen first.
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
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

    if (!account || !symbol) return null;

    return (
        <Form form={form}>
            <VStack spacing="sp32" flex={1}>
                {!!selectedFeeLevelTransaction && (
                    <RecipientsSummary
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        selectedFeeLevel={selectedFeeLevelTransaction}
                    />
                )}
                <VStack flex={1} justifyContent="space-between" spacing="sp24">
                    <FeesContent
                        selectedFeeLevel={selectedFeeLevel}
                        feeLevels={feeLevels}
                        symbol={symbol}
                        networkType={account.networkType}
                        accountKey={accountKey}
                        areFeesLoading={areFeesLoading}
                        onSelectedFeeLevel={handleFeeLevelChange}
                        onCustomFeeSet={handleCustomFeeSet}
                        formDraft={formDraft}
                    />
                    {!!totalAmount && !!fee && (
                        <FeesFooter
                            accountKey={accountKey}
                            isSubmittable={isSubmittable}
                            onSubmit={handleNavigateToReviewScreen}
                            totalAmount={totalAmount}
                            fee={fee}
                            symbol={symbol}
                            tokenContract={tokenContract}
                            withSubmitButton={true}
                        />
                    )}
                </VStack>
            </VStack>
        </Form>
    );
};
