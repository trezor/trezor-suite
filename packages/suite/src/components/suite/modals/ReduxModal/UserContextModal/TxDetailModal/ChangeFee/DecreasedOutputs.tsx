import { ReactNode } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, variables, Radio, motionAnimation } from '@trezor/components';
import { FormattedCryptoAmount, HiddenTextPlaceholder } from 'src/components/suite';
import { Translation, TranslationKey } from 'src/components/suite/Translation';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';
import { GreyCard } from './GreyCard';
import { WarnHeader } from './WarnHeader';

const OutputsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 12px;
    margin-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const Output = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 0;
`;

const OutputInner = styled.div`
    display: flex;
    flex-direction: column;
`;

const OutputLabel = styled.div<{ isChecked: boolean }>`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 24px; /* icon height */
    font-weight: ${$props =>
        $props.isChecked ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ isChecked, theme }) => (isChecked ? theme.TYPE_GREEN : 'inherit')};
`;

const OutputAddress = styled.div<{ isChecked: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${$props =>
        $props.isChecked ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ isChecked, theme }) => (isChecked ? theme.TYPE_DARK_GREY : 'inherit')};
    padding-top: 2px;
`;

const ReducedAmount = styled.span`
    display: flex;
    align-items: center;
`;

const ArrowIcon = styled(Icon)`
    margin: 0 8px;

    & svg {
        fill: ${({ theme }) => theme.TYPE_GREEN};
    }
`;

const StyledRadio = styled(Radio)`
    margin-right: 8px;
`;

export const DecreasedOutputs = () => {
    const {
        showDecreasedOutputs,
        formValues,
        account,
        coinjoinRegisteredUtxos,
        getValues,
        setValue,
        composedLevels,
        composeRequest,
        shouldSendInSats,
    } = useRbfContext();
    const { selectedFee, setMaxOutputId } = getValues();

    // no set-max means that no output was decreased
    if (!showDecreasedOutputs || typeof setMaxOutputId !== 'number') return null;

    let reducedAmount: ReactNode = null;
    if (composedLevels) {
        const precomposedTx = composedLevels[selectedFee || 'normal'];
        if (precomposedTx.type === 'final') {
            reducedAmount = (
                <ReducedAmount>
                    <ArrowIcon icon="ARROW_RIGHT_LONG" />
                    <FormattedCryptoAmount
                        value={formatNetworkAmount(
                            precomposedTx.outputs[setMaxOutputId].amount.toString(),
                            account.symbol,
                        )}
                        symbol={account.symbol}
                    />
                </ReducedAmount>
            );
        }
    }

    // find all outputs possible to reduce
    const useRadio = formValues.outputs.filter(o => typeof o.address === 'string').length > 1;

    let decreaseWarning: TranslationKey = 'TR_DECREASE_TX';
    if (account.accountType === 'coinjoin') {
        if (coinjoinRegisteredUtxos.length > 0) {
            decreaseWarning = 'TR_UTXO_REGISTERED_IN_COINJOIN_RBF_WARNING';
        } else {
            decreaseWarning = 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_RBF_WARNING';
        }
    }

    return (
        <AnimatePresence initial>
            <motion.div {...motionAnimation.expand}>
                <GreyCard>
                    <WarnHeader data-test="@send/decreased-outputs">
                        <Translation id={decreaseWarning} />
                    </WarnHeader>
                    <OutputsWrapper>
                        {formValues.outputs.flatMap((o, i) => {
                            if (typeof o.address !== 'string') return null;
                            const isChecked = setMaxOutputId === i;
                            return (
                                // it's safe to use array index as key since outputs do not change
                                // eslint-disable-next-line react/no-array-index-key
                                <Output key={i}>
                                    {useRadio && (
                                        <StyledRadio
                                            onClick={() => {
                                                setValue('setMaxOutputId', i);
                                                composeRequest();
                                            }}
                                            isChecked={isChecked}
                                        />
                                    )}
                                    <OutputInner>
                                        <OutputLabel isChecked={isChecked}>
                                            <Translation
                                                id="TR_REDUCE_FROM"
                                                values={{
                                                    value: (
                                                        <FormattedCryptoAmount
                                                            value={
                                                                shouldSendInSats
                                                                    ? formatNetworkAmount(
                                                                          o.amount,
                                                                          account.symbol,
                                                                      )
                                                                    : o.amount
                                                            }
                                                            symbol={account.symbol}
                                                        />
                                                    ),
                                                }}
                                            />
                                            {isChecked && reducedAmount}
                                        </OutputLabel>
                                        <OutputAddress isChecked={isChecked}>
                                            <HiddenTextPlaceholder value={o.address} />
                                        </OutputAddress>
                                    </OutputInner>
                                </Output>
                            );
                        })}
                    </OutputsWrapper>
                </GreyCard>
            </motion.div>
        </AnimatePresence>
    );
};
