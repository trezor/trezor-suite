import styled, { useTheme } from 'styled-components';

import { Translation } from 'src/components/suite';
import { IconLegacy, variables, Card } from '@trezor/components';
import { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { borders, typography, zIndices } from '@trezor/theme';

const TransactionDetailsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.legacy.BOX_SHADOW_BLACK_20};
    background: ${({ theme }) => theme.legacy.BG_WHITE_ALT};
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    position: absolute;
    top: -18px;
    left: -12px;
    border-radius: ${borders.radii.xs};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    /* stay above OutputElement_MultiIndicatorWrapper */
    z-index: ${zIndices.expandableNavigation};
`;

const DetailsHeader = styled.div`
    padding: 14px 16px 10px;
    text-align: left;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
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
    margin: 0 0 20px;
`;

const HeadSectionLine = styled.div`
    display: flex;
    ${typography.hint}

    & + & {
        margin: 5px 0 0;
    }
`;

const HeadSectionName = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    margin-right: 15px;
    width: 60px;
`;

const HeadSectionValue = styled.div`
    color: ${({ theme }) => theme.textDefault};
    flex: 1;
`;

const Section = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

const SectionName = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
    margin: 7px 0;
`;

const SectionDivider = styled.div`
    margin: 15px 0;

    > div {
        margin: 0 auto;
    }
`;

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-family: monospace;
    ${typography.label}
`;

export interface TransactionReviewDetailsProps {
    tx: GeneralPrecomposedTransactionFinal;
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
                    <Card paddingType="small" margin={{ bottom: 12 }}>
                        <HeadSectionLine>
                            <HeadSectionName>
                                <Translation id="TR_SIZE" />
                            </HeadSectionName>
                            <HeadSectionValue>
                                {tx.bytes} <Translation id="TR_BYTES" />
                            </HeadSectionValue>
                        </HeadSectionLine>
                    </Card>
                    <Section>
                        <SectionName>
                            <Translation id="TR_INPUTS" />
                        </SectionName>
                        <Card paddingType="small">
                            <Pre>{prettify(tx.inputs)}</Pre>
                        </Card>
                    </Section>
                    <SectionDivider>
                        <IconLegacy
                            icon="ARROW_DOWN"
                            size={20}
                            color={theme.legacy.TYPE_LIGHT_GREY}
                        />
                    </SectionDivider>
                    <Section>
                        <SectionName>
                            <Translation id="TR_OUTPUTS" />
                        </SectionName>
                        <Card paddingType="small">
                            <Pre>{prettify(tx.outputs)}</Pre>
                        </Card>
                    </Section>
                    {txHash && (
                        <Section>
                            <SectionName>
                                <Translation id="RAW_TRANSACTION" />
                            </SectionName>
                            <Card paddingType="small">
                                <Pre>{txHash}</Pre>
                            </Card>
                        </Section>
                    )}
                </DetailsBodyInner>
            </DetailsBody>
        </TransactionDetailsWrapper>
    );
};
