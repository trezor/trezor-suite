import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Input, Tooltip, Icon, colors, Link, TextArea } from '@trezor/components';
import globalMessages from '@suite-support/Messages';
import localMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const LabelLeft = styled.div`
    display: flex;
`;

const InputLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const GreenSpan = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

const Right = styled.div``;

const TooltipContainer = styled.div``;

const StyledLink = styled(Link)``;

const GasInput = styled(Input)`
    padding-bottom: 28px;
    &:first-child {
        padding-right: 20px;
    }
`;

const StyledIcon = styled(Icon)`
    padding: 0 0 0 7px;
`;

const StyledTextarea = styled(TextArea)`
    min-height: 80px;
`;

const NetworkTypeEthereum = () => (
    <Wrapper>
        <Row>
            <GasInput
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                topLabel={
                    <InputLabelWrapper>
                        <LabelLeft>
                            <Translation {...localMessages.TR_GAS_LIMIT} />
                            <TooltipContainer>
                                <Tooltip
                                    content={
                                        <Translation
                                            {...localMessages.TR_GAS_LIMIT_REFERS_TO}
                                            values={{
                                                TR_GAS_QUOTATION: (
                                                    <GreenSpan>
                                                        <Translation
                                                            {...localMessages.TR_GAS_QUOTATION}
                                                        />
                                                    </GreenSpan>
                                                ),
                                                gasLimitTooltipValue: <GreenSpan>aaaaaa</GreenSpan>,
                                            }}
                                        />
                                    }
                                    maxWidth={410}
                                    // todo: put into config
                                    ctaLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_limit"
                                    ctaText={<Translation {...globalMessages.TR_LEARN_MORE_LINK} />}
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon="HELP"
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </TooltipContainer>
                        </LabelLeft>
                        {true && (
                            <Right>
                                <StyledLink onClick={() => {}}>
                                    <Translation {...localMessages.TR_SET_DEFAULT} />
                                </StyledLink>
                            </Right>
                        )}
                    </InputLabelWrapper>
                }
                bottomText={undefined}
                value={1} // TODO: figure out translations in inputs
                isDisabled={false}
                onChange={() => {}}
            />

            <GasInput
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                topLabel={
                    <InputLabelWrapper>
                        <LabelLeft>
                            <Translation {...localMessages.TR_GAS_PRICE} />
                            <TooltipContainer>
                                <Tooltip
                                    content={
                                        <Translation
                                            {...localMessages.TR_GAS_PRICE_REFERS_TO}
                                            values={{
                                                TR_GAS_PRICE_QUOTATION: (
                                                    <GreenSpan>
                                                        <Translation
                                                            {...localMessages.TR_GAS_PRICE_QUOTATION}
                                                        />
                                                    </GreenSpan>
                                                ),
                                                recommendedGasPrice: (
                                                    <GreenSpan>recommendedGasPrice</GreenSpan>
                                                ),
                                            }}
                                        />
                                    }
                                    maxWidth={400}
                                    // todo: put link into config
                                    ctaLink="https://wiki.trezor.io/Ethereum_Wallet#Gas_price"
                                    ctaText={<Translation {...globalMessages.TR_LEARN_MORE_LINK} />}
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon="HELP"
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </TooltipContainer>
                        </LabelLeft>
                    </InputLabelWrapper>
                }
                bottomText=""
                value=""
                onChange={() => {}}
            />
        </Row>
        <Row>
            <StyledTextarea
                topLabel={
                    <InputLabelWrapper>
                        <LabelLeft>
                            <Translation {...localMessages.TR_DATA} />
                            <TooltipContainer>
                                <Tooltip
                                    content={
                                        <Translation {...localMessages.TR_DATA_IS_USUALLY_USED} />
                                    }
                                    placement="top"
                                >
                                    <StyledIcon
                                        icon="HELP"
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </TooltipContainer>
                        </LabelLeft>
                    </InputLabelWrapper>
                }
                state={undefined}
                bottomText=""
                isDisabled={false}
                value=""
                onChange={() => {}}
            />
        </Row>
    </Wrapper>
);

export default NetworkTypeEthereum;
