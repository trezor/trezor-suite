import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Icon, useTheme, Box, variables } from '@trezor/components';
import { PrecomposedTransactionFinal, TxFinalCardano } from '@wallet-types/sendForm';

const TransactionDetailsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    background: ${props => props.theme.BG_WHITE_ALT};
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    position: absolute;
    top: -15px;
    left: -20px;
    border-radius: 4px;
    z-index: 2;
    font-weight: 500;
`;

const DetailsHeader = styled.div`
    padding: 14px 16px 10px;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
`;

const CloseButton = styled.button`
    background: 0;
    margin: 0;
    padding: 0;
    border: 0;
    cursor: pointer;
`;

const DetailsBody = styled.div`
    padding: 10px 16px 14px;
    margin: 0;
    text-align: left;
    flex: 1;
    overflow-y: auto;
`;

const DetailsBodyInner = styled.div`
    margin: 0 0 20px 0;
`;

const HeadSection = styled(Box)`
    text-align: left;
    margin: 0 0 12px 0;
    border: 0;
    background: ${props => props.theme.BG_GREY};
`;

const HeadSectionLine = styled.div`
    display: flex;
    font-size: 14px;
    & + & {
        margin: 5px 0 0 0;
    }
`;

const HeadSectionName = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-right: 15px;
    width: 60px;
`;

const HeadSectionValue = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    flex: 1;
`;

const Section = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    font-size: 12px;
`;

const SectionName = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    font-size: 12px;
    margin: 7px 0;
`;

const SectionDivider = styled.div`
    margin: 15px 0;
`;

const StyledBox = styled(Box)`
    border: 0px;
    background: ${props => props.theme.BG_GREY};
    flex-direction: column;
    align-items: start;
    word-break: break-all;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-size: ${variables.FONT_SIZE.TINY};
`;

export interface Props {
    tx: PrecomposedTransactionFinal | TxFinalCardano;
    txHash?: string;
    onClose: () => void;
}

const prettify = (json: Record<any, any>) => JSON.stringify(json, null, 2);

const TransactionDetails = ({ tx, txHash, onClose }: Props) => {
    const theme = useTheme();
    if (tx.transaction.inputs.length === 0) return null; // BTC-only, TODO: eth/ripple

    return (
        <TransactionDetailsWrapper>
            <DetailsHeader>
                <Translation id="TR_DETAIL" />
                <CloseButton onClick={() => onClose()}>
                    <Icon icon="CROSS" size={16} color={theme.TYPE_LIGHT_GREY} />
                </CloseButton>
            </DetailsHeader>
            <DetailsBody>
                <DetailsBodyInner>
                    <HeadSection>
                        <HeadSectionLine>
                            <HeadSectionName>
                                <Translation id="TR_SIZE" />
                            </HeadSectionName>
                            <HeadSectionValue>
                                {tx.bytes} <Translation id="TR_BYTES" />
                            </HeadSectionValue>
                        </HeadSectionLine>
                    </HeadSection>
                    <Section>
                        <SectionName>
                            <Translation id="TR_INPUTS" />
                        </SectionName>
                        <StyledBox>
                            <Pre>{prettify(tx.transaction.inputs)}</Pre>
                        </StyledBox>
                    </Section>
                    <SectionDivider>
                        <Icon icon="ARROW_DOWN" size={20} color={theme.TYPE_LIGHT_GREY} />
                    </SectionDivider>
                    <Section>
                        <SectionName>
                            <Translation id="TR_OUTPUTS" />
                        </SectionName>
                        <StyledBox>
                            <Pre>{prettify(tx.transaction.outputs)}</Pre>
                        </StyledBox>
                    </Section>
                    {txHash && (
                        <Section>
                            <SectionName>
                                <Translation id="TR_SIGNATURE" />
                            </SectionName>
                            <StyledBox>
                                <Pre>{txHash}</Pre>
                            </StyledBox>
                        </Section>
                    )}
                </DetailsBodyInner>
            </DetailsBody>
        </TransactionDetailsWrapper>
    );
};

export default TransactionDetails;
