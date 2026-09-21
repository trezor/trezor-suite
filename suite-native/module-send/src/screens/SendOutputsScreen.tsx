import { useCallback, useEffect, useRef } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { AccountDetailsCard } from '@suite-native/accounts';
import { BannerInline, Box } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { selectFeeLevels } from '@suite-native/transaction-management';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SwitchCoinControlButton } from '../components/CoinControl/SwitchCoinControlButton';
import { SendFeeSection } from '../components/SendFeeSection';
import { SendOutputFields } from '../components/SendOutputFields';
import { SendOutputsScreenFooter } from '../components/SendOutputsScreenFooter';
import { useSendForm } from '../hooks/useSendForm';
import { useShowDeviceDisconnectedAlert } from '../hooks/useShowDeviceDisconnectedAlert';
import { useUtxoSelection } from '../hooks/useUtxoSelection';
import { getOutputFieldName } from '../utils';

export const SendOutputsScreen = ({
    route: { params },
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey, tokenContract, postNavigationAction, initialAddress, initialAmount } =
        params;
    const sendForm = useSendForm(accountKey, tokenContract);
    const { totalSelectedAmount, selectedUtxos } = useUtxoSelection(accountKey);
    const feeLevels = useSelector(selectFeeLevels);

    const isFeeReady = isFinalPrecomposedTransaction(feeLevels.normal);
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    useFocusEffect(
        useCallback(() => {
            if (postNavigationAction !== 'deviceDisconnectedAlert') return;

            // One-shot param: clear it immediately to avoid re-triggering on subsequent focus.
            navigation.setParams({ postNavigationAction: undefined });
            showDeviceDisconnectedAlert();
        }, [navigation, postNavigationAction, showDeviceDisconnectedAlert]),
    );

    const initialValuesApplied = useRef(false);
    useEffect(() => {
        if (initialValuesApplied.current || !sendForm) return;
        initialValuesApplied.current = true;
        if (initialAddress)
            sendForm.form.setValue(getOutputFieldName(0, 'address'), initialAddress, {
                shouldValidate: true,
            });
        if (initialAmount)
            sendForm.form.setValue(getOutputFieldName(0, 'amount'), initialAmount, {
                shouldValidate: true,
            });
    }, [sendForm, initialAddress, initialAmount]);

    if (!sendForm) {
        return null;
    }

    const {
        form,
        handleSubmitSendForm,
        amount,
        network,
        maxSpendableAmount,
        isResolvingNamedAddress,
    } = sendForm;
    const {
        formState: { isValid, isSubmitting },
    } = form;

    const isMissingUtxos =
        selectedUtxos.length > 0 && amount && totalSelectedAmount.isLessThan(amount);

    return (
        <Screen
            header={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            <>
                <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />

                <Box marginTop="sp32">
                    <Form form={form}>
                        <SendOutputFields
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                            maxAmount={maxSpendableAmount}
                        />
                        {network?.networkType === 'bitcoin' && (
                            <Box flexDirection="row" justifyContent="center" marginTop="sp24">
                                <SwitchCoinControlButton amount={amount} accountKey={accountKey} />
                            </Box>
                        )}
                    </Form>
                </Box>
                <SendFeeSection
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    isFormValid={isValid}
                />
                {isMissingUtxos ? (
                    <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                        <Box padding="sp16">
                            <BannerInline
                                intent="warning"
                                title={<Translation id="moduleSend.coinControl.notEnoughCoins" />}
                            />
                        </Box>
                    </Animated.View>
                ) : (
                    isValid &&
                    isFeeReady &&
                    !isResolvingNamedAddress && (
                        <SendOutputsScreenFooter
                            isSubmitting={isSubmitting}
                            handleNavigateToReviewScreen={handleSubmitSendForm}
                        />
                    )
                )}
            </>
        </Screen>
    );
};
