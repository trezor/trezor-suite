import { Button, Modal, Icon, colors, variables, Checkbox, Link } from '@trezor/components';
import React, { useState } from 'react';
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
};

const CoinmarketTerms = ({ onConfirm, onCancel }: Props) => {
    const [isChecked, setIsChecked] = useState<boolean>(false);

    return (
        <Modal
            hideCancelButton
            padding={['0px', '0px', '0px', '0px']}
            onCancel={onCancel}
            heading={
                <Header>
                    <Left>
                        <StyledIcon size={16} icon="LOCK" />
                        For your safety
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
                    I'm here to buy cryptocurrency. If you were directed to this site for any other
                    reason, please contact Simplex support before proceeding.
                </Text>
                <Text>
                    I'm using Invity to purchase funds that will be sent to an account under my
                    direct personal control.
                </Text>
                <Text>
                    I'm not using Invity for gambling or any other violation of Invity’s Terms of
                    service.
                </Text>
                <Text>
                    I understand that cryptocurrencies are an emerging financial tool and that
                    regulations may be limited in some areas. This may put me at a higher risk of
                    fraud, theft, or market instability.
                </Text>
                <Text isLast>
                    I understand that cryptocurrency transactions are irreversible and I won’t be
                    able to receive a refund for my purchase.
                </Text>
            </Terms>
            <Footer>
                <FooterContent>
                    <Checkbox isChecked={isChecked} onClick={() => setIsChecked(!isChecked)}>
                        <CheckText>I understand and agree to all of the above</CheckText>
                    </Checkbox>
                    <Button
                        isDisabled={!isChecked}
                        onClick={() => {
                            onCancel();
                            onConfirm();
                        }}
                    >
                        Confirm
                    </Button>
                </FooterContent>
            </Footer>
        </Modal>
    );
};

export default CoinmarketTerms;
