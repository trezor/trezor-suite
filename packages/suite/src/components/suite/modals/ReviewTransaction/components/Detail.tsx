import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { variables, colors, Icon, Box } from '@trezor/components';
import { Translation } from '@suite-components';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { ANIMATION } from '@suite-config';

const Wrapper = styled.div``;

const ExpandWrapper = styled(motion.div)`
    overflow: hidden;
    padding-top: 12px;
`;

const StyledBox = styled(Box)`
    border: 0px;
    background: ${colors.NEUE_BG_GRAY};
    flex-direction: column;
    align-items: start;
    word-break: break-all;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const ExpandButton = styled.div`
    display: flex;
    padding: 0px 14px;
    cursor: pointer;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    justify-content: space-between;
`;

const Top = styled.div`
    width: 100%;
    border-bottom: solid 1px ${colors.NEUE_STROKE_GREY};
    display: flex;
    flex-direction: row;
`;

const Label = styled.span`
    color: #808080;
    margin-right: 8px;
    padding: 8px 0px;
`;

const Fee = styled.div`
    display: flex;
    flex: 1;
    text-align: left;
    align-items: center;
`;

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-size: ${variables.FONT_SIZE.TINY};
`;

type Props = {
    tx: PrecomposedTransactionFinal;
    txHash?: string;
};

const Detail = ({ tx, txHash }: Props) => {
    const [isExpanded, setExpanded] = useState(false);

    const { transaction } = tx;
    if (transaction.inputs.length === 0) return null; // BTC-only, TODO: eth/ripple

    const prettify = (json: Record<any, any>) => {
        return JSON.stringify(json, null, 2);
    };

    return (
        <Wrapper>
            <ExpandButton
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(!isExpanded);
                }}
            >
                <Translation id="TR_TRANSACTION_DETAILS" />
                <Icon size={16} icon={!isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'} />
            </ExpandButton>
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <ExpandWrapper {...ANIMATION.EXPAND}>
                        <StyledBox>
                            <Top>
                                <Fee>
                                    <Label>sat/B:</Label> {tx.feePerByte}
                                </Fee>
                                <Fee>
                                    <Label>Size:</Label> {tx.bytes} bytes
                                </Fee>
                            </Top>
                            <Label>Inputs:</Label>
                            <Pre>{prettify(transaction.inputs)}</Pre>
                            <Label>Outputs:</Label>
                            <Pre>{prettify(transaction.outputs)}</Pre>
                            {txHash && (
                                <>
                                    <Label>Signature</Label>
                                    <Pre>{txHash}</Pre>
                                </>
                            )}
                        </StyledBox>
                    </ExpandWrapper>
                )}
            </AnimatePresence>
        </Wrapper>
    );
};

export default Detail;
