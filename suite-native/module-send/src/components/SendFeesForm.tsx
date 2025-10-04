import React from 'react';
import { useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';

import { SendRootState, selectSendFormDraftByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    CustomFee,
    FeeOptionsList,
    FeesFooter,
    NativeSendRootState,
    NativeSupportedFeeLevel,
    useFeesManagement,
} from '@suite-native/transaction-management';

import { RecipientsSummary } from './RecipientsSummary';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import { useRequestDelayedNavigationToOutputsReview } from '../hooks/useRequestDelayedNavigationToOutputsReview';
import { selectDestinationTagFromDraft } from '../selectors';
import { updateSelectedFeeLevelThunk } from '../sendFormThunks';

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
        selectedFee: formDraft?.selectedFee as NativeSupportedFeeLevel,
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
            {/*// BottomSheetModalProvider must be inside FormProvider to keep context available for sheets rendered via portal*/}
            <BottomSheetModalProvider>
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
                                        symbol={symbol}
                                        isLoading={areFeesLoading}
                                        onSelectedFeeLevel={handleFeeLevelChange}
                                    />
                                )}
                                <CustomFee
                                    symbol={symbol}
                                    accountKey={accountKey}
                                    onCustomFeeSet={handleCustomFeeSet}
                                    formDraft={formDraft}
                                />
                            </VStack>
                        </VStack>
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
                    </VStack>
                </VStack>
            </BottomSheetModalProvider>
        </Form>
    );
};
