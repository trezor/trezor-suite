import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import { isFulfilled } from '@reduxjs/toolkit';
import { useNavigation } from '@react-navigation/native';

import { VStack, Button } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { useDebounce } from '@trezor/react-utils';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectDevice,
    selectNetworkFeeInfo,
    selectSendFormDraftByAccountKey,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { getNetwork } from '@suite-common/wallet-utils';

import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { SendOutputFields } from './SendOutputFields';

type SendFormProps = {
    accountKey: AccountKey;
};

// TODO: this data structure will be revisited in a follow up PR
const constructFormDraft = ({ outputs }: SendOutputsFormValues): FormState => ({
    outputs: outputs.map(({ address, amount }) => ({
        address,
        amount,
        type: 'payment',
        token: null,
        fiat: '0',
        currency: { label: '', value: '' },
    })),
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    feeLimit: '',
    feePerUnit: '',
    options: [],
    selectedFee: 'normal',
});

export const SendOutputsForm = ({ accountKey }: SendFormProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { showToast } = useToast();
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendReview>>();

    const device = useSelector(selectDevice);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByAccountKey(state, accountKey),
    );

    const form = useForm<SendOutputsFormValues>({
        validation: sendOutputsFormValidationSchema,
        context: {
            networkFeeInfo,
            networkSymbol: account?.symbol,
            availableAccountBalance: account?.availableBalance,
        },
        defaultValues: {
            outputs: [
                {
                    address: sendFormDraft?.outputs?.[0]?.address,
                    amount: sendFormDraft?.outputs?.[0]?.amount,
                },
            ],
        },
    });

    const {
        handleSubmit,
        control,
        getValues,
        formState: { isValid, isSubmitting },
    } = form;
    const watchedFormValues = useWatch({ control });

    const storeFormDraftIfValid = useCallback(() => {
        dispatch(
            sendFormActions.storeDraft({
                accountKey,
                formState: constructFormDraft(getValues()),
            }),
        );
    }, [accountKey, dispatch, getValues]);

    useEffect(() => {
        if (watchedFormValues && isValid) debounce(storeFormDraftIfValid);
    }, [isValid, storeFormDraftIfValid, watchedFormValues, debounce]);

    const network = getNetwork(account!.symbol);

    if (!account || !networkFeeInfo || !device || !network) return null;

    const handleNavigateToReviewScreen = handleSubmit(async values => {
        //compose transaction with specific fee levels
        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft(values),
                composeContext: {
                    account,
                    network: network!,
                    feeInfo: networkFeeInfo,
                },
            }),
        );

        if (isFulfilled(response)) {
            navigation.navigate(SendStackRoutes.SendFees, {
                accountKey,
                feeLevels: response.payload,
            });

            return;
        }

        // TODO: display error message based on the error code saved in the redux state
        showToast({ variant: 'error', message: 'Something went wrong', icon: 'closeCircle' });

        navigation.navigate(SendStackRoutes.SendAccounts);
    });

    return (
        <Form form={form}>
            <VStack spacing="medium">
                <SendOutputFields />
                {isValid && (
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="validate send form"
                        testID="@send/form-submit-button"
                        onPress={handleNavigateToReviewScreen}
                        isDisabled={isSubmitting}
                    >
                        continue
                    </Button>
                )}
            </VStack>
        </Form>
    );
};
