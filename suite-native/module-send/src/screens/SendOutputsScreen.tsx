import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Keyboard } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
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
import { getNetwork } from '@suite-common/wallet-config';
import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FormState } from '@suite-common/wallet-types';
import { useForm, Form } from '@suite-native/forms';
import { selectIsAmountInSats, SettingsSliceRootState } from '@suite-native/settings';

import { SendScreen } from '../components/SendScreen';
import { SendOutputFields } from '../components/SendOutputFields';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { AccountBalanceScreenHeader } from '../components/SendScreenSubHeader';
import { calculateMaxAmountWithNormalFeeThunk } from '../sendFormThunks';

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    padding: utils.spacings.medium,
}));

const DEFAULT_VALUES = [
    {
        amount: '',
        address: '',
        fiat: '',
    },
] as const satisfies SendOutputsFormValues['outputs'];

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
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendOutputs>>();

    const [normalFeeMaxAmount, setNormalFeeMaxAmount] = useState<string>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, account?.symbol),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByAccountKey(state, accountKey),
    );

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<SendOutputsFormValues>({
        validation: sendOutputsFormValidationSchema,
        context: {
            networkFeeInfo,
            networkSymbol: account?.symbol,
            availableAccountBalance: account?.availableBalance,
            isValueInSats: isAmountInSats,
            normalFeeMaxAmount,
            decimals: network?.decimals,
        },
        defaultValues: {
            outputs: sendFormDraft?.outputs ?? DEFAULT_VALUES,
        },
    });

    const {
        handleSubmit,
        control,
        getValues,
        formState: { isValid, isSubmitting },
    } = form;
    const watchedFormValues = useWatch({ control });
    const watchedAddress = useWatch({ name: 'outputs.0.address', control });

    const storeFormDraftIfValid = useCallback(() => {
        dispatch(
            sendFormActions.storeDraft({
                accountKey,
                formState: constructFormDraft(getValues()),
            }),
        );
    }, [accountKey, dispatch, getValues]);

    // Triggered for every change of watchedFormValues.
    useEffect(() => {
        if (isValid) debounce(storeFormDraftIfValid);
    }, [storeFormDraftIfValid, watchedFormValues, debounce, isValid]);

    const calculateNormalFeeMaxAmount = useCallback(async () => {
        const response = await dispatch(
            calculateMaxAmountWithNormalFeeThunk({
                formState: constructFormDraft(getValues()),
                accountKey,
            }),
        );

        if (isFulfilled(response)) {
            setNormalFeeMaxAmount(response.payload);
        }
    }, [getValues, accountKey, dispatch]);

    useEffect(() => {
        calculateNormalFeeMaxAmount();
    }, [watchedAddress, calculateNormalFeeMaxAmount, networkFeeInfo]);

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (account) dispatch(updateFeeInfoThunk(account.symbol));
    }, [account, dispatch]);

    if (!account || !networkFeeInfo) return null;

    const handleNavigateToReviewScreen = handleSubmit(async values => {
        // Keyboard has to be dismissed here before navigating, so it's animation is not interfering with the animations on the FeesScreen.
        Keyboard.dismiss();

        if (!network) return;

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
