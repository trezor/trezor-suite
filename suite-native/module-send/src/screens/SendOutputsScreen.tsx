import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { SendRootState, selectSendFormDraftByKey } from '@suite-common/wallet-core';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Screen, SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SwitchCoinControlButton } from '../components/CoinControl/SwitchCoinControlButton';
import { SendOutputFields } from '../components/SendOutputFields';
import { SendOutputsScreenFooter } from '../components/SendOutputsScreenFooter';
import { useSendForm } from '../hooks/useSendForm';
import { useUtxoSelection } from '../hooks/useUtxoSelection';

export const SendOutputsScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey, tokenContract } = params;
    const sendForm = useSendForm(accountKey, tokenContract);
    const { totalSelectedAmount, selectedUtxos } = useUtxoSelection(accountKey);

    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    if (!sendForm) {
        return null;
    }

    const { form, handleSubmitSendForm, amount, network } = sendForm;
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
            footer={
                isMissingUtxos ? (
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                        <Box padding="sp16">
                            <InlineAlertBox
                                variant="warning"
                                title={<Translation id="moduleSend.coinControl.notEnoughCoins" />}
                            />
                        </Box>
                    </Animated.View>
                ) : null
            }
            focusedInputBottomOffset={148}
        >
            <>
                <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />

                <Box marginTop="sp32">
                    <Form form={form}>
                        <SendOutputFields accountKey={accountKey} tokenContract={tokenContract} />
                        {isValid && (
                            <Box marginTop="sp24">
                                <FeeSummaryCard
                                    accountKey={accountKey}
                                    tokenContract={tokenContract}
                                    updateThunk={updateSelectedFeeLevelThunk}
                                    formDraft={sendFormDraft}
                                    testID="@moduleSend/fee-summary-card"
                                />
                            </Box>
                        )}
                        {network?.networkType === 'bitcoin' && (
                            <Box flexDirection="row" justifyContent="center" marginTop="sp24">
                                <SwitchCoinControlButton amount={amount} accountKey={accountKey} />
                            </Box>
                        )}
                        {isValid && (
                            <SendOutputsScreenFooter
                                isSubmitting={isSubmitting}
                                handleNavigateToReviewScreen={handleSubmitSendForm}
                            />
                        )}
                    </Form>
                </Box>
            </>
        </Screen>
    );
};
