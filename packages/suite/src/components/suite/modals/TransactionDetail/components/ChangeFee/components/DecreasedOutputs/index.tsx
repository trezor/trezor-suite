import React from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, variables, RadioButton } from '@trezor/components';
import { Translation, FormattedCryptoAmount } from '@suite-components';
import { ANIMATION } from '@suite-config';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { useRbfContext } from '@wallet-hooks/useRbfForm';
import GreyCard from '../GreyCard';
import WarnHeader from '../WarnHeader';

const OutputsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 12px;
    margin-top: 24px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Output = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 0px;
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
    color: ${$props => ($props.isChecked ? $props.theme.TYPE_GREEN : 'inherit')};
`;

const OutputAddress = styled.div<{ isChecked: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${$props =>
        $props.isChecked ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${$props => ($props.isChecked ? $props.theme.TYPE_DARK_GREY : 'inherit')};
    padding-top: 2px;
`;

const ReducedAmount = styled.span`
    display: flex;
    align-items: center;
`;

const ArrowIcon = styled(Icon)`
    margin: 0px 8px;
    & svg {
        fill: ${$props => $props.theme.TYPE_GREEN};
    }
`;

const DecreasedOutputs = () => {
    const {
        formValues,
        account,
        getValues,
        setValue,
        composedLevels,
        composeRequest,
    } = useRbfContext();
    const { selectedFee, setMaxOutputId } = getValues();
    if (typeof setMaxOutputId !== 'number') return null; // no set-max means that no output was decreased

    let reducedAmount: React.ReactNode = null;
    if (composedLevels) {
        const precomposedTx = composedLevels[selectedFee || 'normal'];
        if (precomposedTx.type === 'final') {
            reducedAmount = (
                <ReducedAmount>
                    <ArrowIcon icon="ARROW_RIGHT_LONG" />
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={formatNetworkAmount(
                            precomposedTx.transaction.outputs[setMaxOutputId].amount,
                            account.symbol,
                        )}
                        symbol={account.symbol}
                    />
                </ReducedAmount>
            );
        }
    }

    // find all outputs possible to reduce
    const useRadioButtons =
        formValues.outputs.filter(o => typeof o.address === 'string').length > 1;

    return (
        <AnimatePresence initial>
            <motion.div {...ANIMATION.EXPAND}>
                <GreyCard>
                    <WarnHeader>
                        <Translation id="TR_DECREASE_TX" />
                    </WarnHeader>
                    <OutputsWrapper>
                        {formValues.outputs.flatMap((o, i) => {
                            if (typeof o.address !== 'string') return null;
                            const isChecked = setMaxOutputId === i;
                            return (
                                // it's safe to use array index as key since outputs do not change
                                <Output key={i}>
                                    {useRadioButtons && (
                                        <RadioButton
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
                                                            disableHiddenPlaceholder
                                                            value={o.amount}
                                                            symbol={account.symbol}
                                                        />
                                                    ),
                                                }}
                                            />
                                            {isChecked && reducedAmount}
                                        </OutputLabel>
                                        <OutputAddress isChecked={isChecked}>
                                            {o.address}
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

export default DecreasedOutputs;
