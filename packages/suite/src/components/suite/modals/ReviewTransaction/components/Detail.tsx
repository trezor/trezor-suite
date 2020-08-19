import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { variables, colors, Button, Box } from '@trezor/components';
import { Translation } from '@suite-components';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';

const TargetWrapper = styled(motion.div)`
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

const ExpandButton = styled(Button)`
    justify-content: start;
    align-self: flex-start;
    background: transparent;
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

// TODO: move this to some common file
const ANIMATION = {
    variants: {
        initial: {
            overflow: 'hidden',
            height: 0,
        },
        visible: {
            height: 'auto',
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: 0.24, ease: 'easeInOut' },
};

type Props = {
    tx: PrecomposedTransactionFinal;
    txHash?: string;
};

export default ({ tx, txHash }: Props) => {
    const [opened, setOpened] = useState(false);

    const { transaction } = tx;
    if (transaction.inputs.length === 0) return null; // BTC-only, TODO: eth/ripple

    const prettify = (json: Record<any, any>) => {
        return JSON.stringify(json, null, 2);
    };

    return (
        <div>
            <ExpandButton
                variant="tertiary"
                icon={!opened ? 'ARROW_DOWN' : 'ARROW_UP'}
                alignIcon="right"
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpened(!opened);
                }}
            >
                <Translation id="TR_TRANSACTION_DETAILS" />
            </ExpandButton>
            <AnimatePresence initial={false}>
                {opened && (
                    <TargetWrapper {...ANIMATION}>
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
                    </TargetWrapper>
                )}
            </AnimatePresence>
        </div>
    );
};
