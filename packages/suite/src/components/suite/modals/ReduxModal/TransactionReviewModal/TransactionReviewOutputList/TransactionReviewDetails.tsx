import styled, { useTheme } from 'styled-components';

import { Translation } from 'src/components/suite';
import { Icon, Box, variables } from '@trezor/components';
import { PrecomposedTransactionFinal, TxFinalCardano } from 'src/types/wallet/sendForm';

const TransactionDetailsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    background: ${({ theme }) => theme.BG_WHITE_ALT};
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    position: absolute;
    top: -15px;
    left: -20px;
    border-radius: 8px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* stay above OutputElement_MultiIndicatorWrapper */
    z-index: ${variables.Z_INDEX.EXPANDABLE_NAVIGATION};
`;

const DetailsHeader = styled.div`
    padding: 14px 16px 10px;
    text-align: left;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    display: flex;
    justify-content: space-between;
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
    background: ${({ theme }) => theme.BG_GREY};
`;

const HeadSectionLine = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    & + & {
        margin: 5px 0 0 0;
    }
`;

const HeadSectionName = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-right: 15px;
    width: 60px;
`;

const HeadSectionValue = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    flex: 1;
`;

const Section = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SectionName = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 7px 0;
`;

const SectionDivider = styled.div`
    margin: 15px 0;

    > div {
        margin: 0 auto;
    }
`;

const StyledBox = styled(Box)`
    border: 0px;
    background: ${({ theme }) => theme.BG_GREY};
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

export interface TransactionReviewDetailsProps {
    tx: PrecomposedTransactionFinal | TxFinalCardano;
    txHash?: string;
}

const prettify = (json: Record<any, any>) => JSON.stringify(json, null, 2);

export const TransactionReviewDetails = ({ tx, txHash }: TransactionReviewDetailsProps) => {
    const theme = useTheme();
    if (tx.inputs.length === 0) return null; // BTC-only, TODO: eth/ripple

    return (
        <TransactionDetailsWrapper>
            <DetailsHeader>
                <Translation id="TR_DETAIL" />
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
                            <Pre>{prettify(tx.inputs)}</Pre>
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
                            <Pre>{prettify(tx.outputs)}</Pre>
                        </StyledBox>
                    </Section>
                    {txHash && (
                        <Section>
                            <SectionName>
                                <Translation id="RAW_TRANSACTION" />
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
