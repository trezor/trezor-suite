import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import { isRejected } from '@reduxjs/toolkit';
import { useNavigation } from '@react-navigation/native';

import { VStack, Button } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { useDebounce } from '@trezor/react-utils';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    selectAccountByKey,
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

import { onDeviceTransactionReviewThunk } from '../sendFormThunks';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { SendOutputFields } from './SendOutputFields';

type SendFormProps = {
    accountKey: AccountKey;
};

// TODO: this data structure will be revisited in a follow up PR
const constructFormDraft = ({ outputs }: SendOutputsFormValues): FormState => ({
    outputs: outputs.map(({ address, amount }) => ({
        type: 'payment',
        address,
        amount,
        token: null,
        fiat: '0',
        currency: { label: 'usd', value: '1000' },
    })),
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    feeLimit: '0',
    feePerUnit: '0',
    options: [],
});

export const SendOutputsForm = ({ accountKey }: SendFormProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { showToast } = useToast();
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendReview>>();

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
                    address: 'bcrt1q7r9yvcdgcl6wmtta58yxf29a8kc96jkyyk8fsw',
                    amount: sendFormDraft?.outputs[0]?.amount,
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

    const handleNavigateToReviewScreen = handleSubmit(async values => {
        // TODO: navigate to SendFeeScreen instead, when ready
        // issue: https://github.com/trezor/trezor-suite/issues/10871
        navigation.navigate(SendStackRoutes.SendReview, { accountKey });
        const response = await dispatch(
            onDeviceTransactionReviewThunk({
                accountKey,
                formState: constructFormDraft(values),
            }),
        );

        if (isRejected(response)) {
            // TODO: display error message based on the error code
            showToast({ variant: 'error', message: 'Something went wrong', icon: 'closeCircle' });

            navigation.navigate(SendStackRoutes.SendAccounts);
        }
    });

    return (
        <Form form={form}>
            <VStack spacing="medium" padding="medium">
                <SendOutputFields />
                {isValid && (
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="validate send form"
                        testID="@send/form-submit-button"
                        onPress={handleNavigateToReviewScreen}
                        isDisabled={isSubmitting}
                    >
                        Review & Send
                    </Button>
                )}
            </VStack>
        </Form>
    );
};
