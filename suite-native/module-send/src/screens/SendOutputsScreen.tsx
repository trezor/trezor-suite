import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type SendRootState, selectSendFormDraftByKey } from '@suite-common/wallet-core';
import { type FeeLevelLabel, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import { FeeSelector, selectFeeLevels } from '@suite-native/transaction-management';

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
    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const feeLevels = useSelector(selectFeeLevels);
    const isFeeReady = isFinalPrecomposedTransaction(feeLevels.normal);

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
        >
            <>
                <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />

                <Box marginTop="sp32">
                    <Form form={form}>
                        <SendOutputFields accountKey={accountKey} tokenContract={tokenContract} />
                        {network?.networkType === 'bitcoin' && (
                            <Box flexDirection="row" justifyContent="center" marginTop="sp24">
                                <SwitchCoinControlButton amount={amount} accountKey={accountKey} />
                            </Box>
                        )}
                    </Form>
                </Box>
                {isValid && network && (
                    <Box marginTop="sp24">
                        <FeeSelector
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                            updateThunk={updateSelectedFeeLevelThunk}
                            selectedFee={
                                (formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'
                            }
                            selectedFeePerUnit={formDraft?.feePerUnit}
                            selectedSetMaxOutputId={formDraft?.setMaxOutputId}
                            formDraft={formDraft}
                        />
                    </Box>
                )}
                {isMissingUtxos ? (
                    <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                        <Box padding="sp16">
                            <InlineAlertBox
                                variant="warning"
                                title={<Translation id="moduleSend.coinControl.notEnoughCoins" />}
                            />
                        </Box>
                    </Animated.View>
                ) : (
                    isValid &&
                    isFeeReady && (
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
