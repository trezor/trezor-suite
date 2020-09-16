import { Button, Modal, Icon, colors, variables, Checkbox, Link } from '@trezor/components';
import React, { useState } from 'react';
import { Translation } from '@suite-components';
import styled, { css } from 'styled-components';

const Text = styled.div<{ isLast?: boolean; isFirst?: boolean }>`
    padding: 20px 0;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    text-align: left;

    ${props =>
        props.isLast &&
        css`
            border-bottom: 0;
        `};

    ${props =>
        props.isFirst &&
        css`
            padding-top: 0;
        `};
`;

const Terms = styled.div`
    padding: 10px 35px;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    padding: 35px;
`;

const StyledIcon = styled(Icon)`
    padding-right: 9px;
`;

const CheckText = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
`;

const Footer = styled.div`
    display: flex;
    padding: 35px 0;
    flex: 1;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const FooterContent = styled.div`
    display: flex;
    justify-content: space-between;
    flex: 1;
    padding: 0 35px;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
`;

const StyledLink = styled(Link)``;

export type Props = {
    onConfirm: () => void;
    onCancel: () => void;
    provider?: string;
};

const CoinmarketTerms = ({ onConfirm, onCancel, provider }: Props) => {
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const providerName = provider || 'unknown provider';

    return (
        <Modal
            noPadding
            onCancel={onCancel}
            heading={
                <Header>
                    <Left>
                        <StyledIcon size={16} icon="LOCK" />
                        <Translation id="TR_BUY_FOR_YOUR_SAFETY" />
                    </Left>
                    <Right>
                        <StyledLink onClick={onCancel}>
                            <Icon size={24} color={colors.BLACK0} icon="CROSS" />
                        </StyledLink>
                    </Right>
                </Header>
            }
        >
            <Terms>
                <Text isFirst>
                    <Translation id="TR_BUY_TERMS_1" values={{ provider: providerName }} />
                </Text>
                <Text>
                    <Translation id="TR_BUY_TERMS_2" />
                </Text>
                <Text>
                    <Translation id="TR_BUY_TERMS_3" />
                </Text>
                <Text>
                    <Translation id="TR_BUY_TERMS_4" />
                </Text>
                <Text isLast>
                    <Translation id="TR_BUY_TERMS_5" />
                </Text>
            </Terms>
            <Footer>
                <FooterContent>
                    <Checkbox isChecked={isChecked} onClick={() => setIsChecked(!isChecked)}>
                        <CheckText>
                            <Translation id="TR_BUY_I_UNDERSTAND" />
                        </CheckText>
                    </Checkbox>
                    <Button
                        isDisabled={!isChecked}
                        onClick={() => {
                            onCancel();
                            onConfirm();
                        }}
                    >
                        <Translation id="TR_BUY_CONFIRM" />
                    </Button>
                </FooterContent>
            </Footer>
        </Modal>
    );
};

export default CoinmarketTerms;
