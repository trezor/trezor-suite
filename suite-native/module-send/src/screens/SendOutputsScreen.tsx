import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

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
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { getNetwork } from '@suite-common/wallet-utils';
import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FormState } from '@suite-common/wallet-types';
import { useForm, Form } from '@suite-native/forms';

import { SendScreen } from '../components/SendScreen';
import { SendOutputFields } from '../components/SendOutputFields';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { AccountBalanceScreenHeader } from '../components/SendScreenSubHeader';

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    padding: utils.spacings.medium,
}));

// TODO: this data structure will be revisited in a follow up PR
const constructFormDraft = ({ outputs }: SendOutputsFormValues): FormState => ({
    outputs: outputs.map(({ address, amount, fiat = '' }) => ({
        address,
        amount,
        type: 'payment',
        token: null,
        fiat,
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

export const SendOutputsScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey } = params;
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const debounce = useDebounce();
    const { showToast } = useToast();

    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendOutputs>>();

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
            mode: 'onChange',
        },
        defaultValues: {
            outputs: [
                {
                    address: sendFormDraft?.outputs?.[0]?.address ?? '',
                    amount: sendFormDraft?.outputs?.[0]?.amount ?? '',
                    fiat: sendFormDraft?.outputs?.[0]?.fiat ?? '',
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

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (account) dispatch(updateFeeInfoThunk(account.symbol));
    }, [account, dispatch]);

    const network = getNetwork(account!.symbol);

    if (!account || !networkFeeInfo || !device || !network) return null;

    const handleNavigateToReviewScreen = handleSubmit(async values => {
        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft(values),
                composeContext: {
                    account,
                    network,
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
        <SendScreen
            screenHeader={<AccountBalanceScreenHeader accountKey={accountKey} />}
            footer={
                isValid && (
                    <Animated.View
                        entering={SlideInDown}
                        exiting={SlideOutDown}
                        style={applyStyle(buttonWrapperStyle)}
                    >
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel="validate send form"
                            testID="@send/form-submit-button"
                            onPress={handleNavigateToReviewScreen}
                            isDisabled={isSubmitting}
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Animated.View>
                )
            }
        >
            <Box marginTop="extraLarge" paddingBottom="xxl">
                <Form form={form}>
                    <Box flex={1} justifyContent="space-between">
                        <SendOutputFields accountKey={accountKey} />
                    </Box>
                </Form>
            </Box>
        </SendScreen>
    );
};
