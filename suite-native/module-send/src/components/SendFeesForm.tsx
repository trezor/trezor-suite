import React, { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    selectAccountByKey,
    selectAreFeesLoading,
    selectConvertedNetworkFeeLevelFeePerUnit,
    selectSendFormDraftByKey,
    useFetchFeesOnce,
    useRefetchFees,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    TokenAddress,
} from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
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
    selectDestinationTagFromDraft,
    selectFeeLevels,
    useFeesForm,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { RecipientsSummary } from './RecipientsSummary';
import { useCustomFee } from '../hooks/useCustomFee';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import { useRequestDelayedNavigationToOutputsReview } from '../hooks/useRequestDelayedNavigationToOutputsReview';
import { UpdateSelectedFeeLevelThunkParams, updateSelectedFeeLevelThunk } from '../sendFormThunks';

type SendFormProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type SendFeesNavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendFees,
    RootStackParamList
>;

// CustomFeeWrapper component that uses useCustomFee hook and renders CustomFee
// useCustomFee is not working with Form component, so we need to wrap it in a component that has access to the form context
const CustomFeeWrapper = ({
    accountKey,
    tokenContract,
    symbol,
    onCustomFeeSet,
}: {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    symbol: NetworkSymbol;
    onCustomFeeSet: (customFeePerUnit: string, customFeeLimit?: string) => void;
}) => {
    const {
        feeValue: feeValueCustomFee,
        isFeeLoading: isFeeLoadingCustomFee,
        isSubmittable: isSubmittableCustomFee,
        isErrorBoxVisible: isErrorBoxVisibleCustomFee,
    } = useCustomFee({
        accountKey,
        tokenContract,
    });

    return (
        <CustomFee
            symbol={symbol}
            accountKey={accountKey}
            feeValue={feeValueCustomFee}
            isFeeLoading={isFeeLoadingCustomFee}
            isSubmittable={isSubmittableCustomFee}
            isErrorBoxVisible={isErrorBoxVisibleCustomFee}
            onCustomFeeSet={onCustomFeeSet}
        />
    );
};

export const SendFeesForm = ({ accountKey, tokenContract }: SendFormProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<SendFeesNavigationProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );

    const feeLevels = useSelector(selectFeeLevels);

    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    const networkType = account?.symbol ? getNetworkType(account.symbol) : undefined;

    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );

    const normalFee = feeLevels.normal as PrecomposedTransactionFinal; // user is not allowed to enter this screen if normal fee is not final

    const form = useFeesForm({
        accountKey,
        defaultFeeLevel: formDraft?.selectedFee as NativeSupportedFeeLevel,
        defaultFeePerUnit: formDraft?.feePerUnit,
    });
    const { handleSubmit, control } = form;

    useFetchFeesOnce({ networkSymbol: account?.symbol });

    const selectedFeeLevel = useWatch({ control, name: 'feeLevel' });
    const selectedFeeLevelTransaction = feeLevels[
        selectedFeeLevel
    ] as GeneralPrecomposedTransactionFinal;

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeLevelFeePerUnit(state, account?.symbol, selectedFeeLevel),
    );

    useRefetchFees({
        networkSymbol: account?.symbol,
        isDisabled: selectedFeeLevel === 'custom' || formDraft?.setMaxOutputId !== undefined,
    });

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

    const requestDelayedNavigationToOutputsReview = useRequestDelayedNavigationToOutputsReview({
        accountKey,
        tokenContract,
    });

    if (!account) return;

    const handleFeeLevelChange = (
        feeLevel: NativeSupportedFeeLevel,
        customFeePerUnit?: string,
        customFeeLimit?: string,
    ) => {
        analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeLevel } });

        let params: UpdateSelectedFeeLevelThunkParams;
        if (feeLevel === 'custom') {
            params = {
                accountKey,
                tokenContract,
                feeLevelLabel: 'custom',
                feePerUnit: customFeePerUnit!,
                feeLimit: customFeeLimit,
            };
        } else {
            params = {
                accountKey,
                tokenContract,
                feeLevelLabel: feeLevel,
            };
        }
        dispatch(updateSelectedFeeLevelThunk(params));
    };

    const handleCustomFeeSet = (customFeePerUnit: string, customFeeLimit?: string) => {
        handleFeeLevelChange('custom', customFeePerUnit, customFeeLimit);
    };

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
                                    isLoading={areFeesLoading}
                                    onSelectedFeeLevel={handleFeeLevelChange}
                                />
                            )}
                            <CustomFeeWrapper
                                symbol={account.symbol}
                                accountKey={accountKey}
                                tokenContract={tokenContract}
                                onCustomFeeSet={handleCustomFeeSet}
                            />
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
