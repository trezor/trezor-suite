import { colors, variables, Icon, Button } from '@trezor/components';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { ProvidedByInvity } from '@wallet-components';
import { useOnClickOutside } from '@suite-utils/dom';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const CoinmarketFooter = () => {
    const [toggled, setToggled] = useState(false);
    const menuRef = useRef<any>(null);
    const toggleRef = useRef<any>(null);

    useOnClickOutside([menuRef, toggleRef], () => {
        if (toggled) {
            setToggled(false);
        }
    });

    return (
        <Wrapper>
            <Left>
                <ProvidedByInvity />
            </Left>
            <Right>
                {toggled && (
                    <FooterBox ref={menuRef}>
                        <Header>
                            <BoxLeft>
                                <Link href="https://invity.io/" target="_blank">
                                    <Image src={resolveStaticPath('/images/svg/invity-logo.svg')} />
                                </Link>
                            </BoxLeft>
                            <BoxRight>
                                <Button variant="tertiary">invity.io</Button>
                                <IconWrapper onClick={() => setToggled(false)}>
                                    <StyledIcon icon="CROSS" size={16} />
                                </IconWrapper>
                            </BoxRight>
                        </Header>
                        <Text>
                            Invity is our sole provider, and only sees ur something, something and
                            something else.
                        </Text>
                        <Text>Invity will not see your something, and something.</Text>
                    </FooterBox>
                )}
                <Toggle ref={toggleRef} onClick={() => setToggled(true)}>
                    <Translation id="TR_BUY_LEARN_MORE" />
                </Toggle>
            </Right>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    padding-top: 20px;
    margin-top: 60px;
    margin-bottom: 40px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    position: relative;
    font-size: ${variables.FONT_SIZE.SMALL};
    justify-content: flex-end;
`;

const FooterBox = styled.div`
    position: absolute;
    border-radius: 4px;
    padding: 10px;
    flex: 1;
    min-width: 345px;
    bottom: 30px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    z-index: 1;

    background: ${colors.NEUE_BG_WHITE};
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const BoxLeft = styled.div``;
const BoxRight = styled.div`
    display: flex;
    align-items: center;
`;

const Image = styled.img`
    width: 70px;
`;

const Link = styled.a`
    display: flex;
    flex: 1;
    padding-top: 1px;
    align-items: center;
`;

const IconWrapper = styled.div`
    cursor: pointer;
    margin-left: 10px;
`;

const StyledIcon = styled(Icon)``;

const Text = styled.div`
    padding-left: 10px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 15px;
`;

const Toggle = styled.div`
    cursor: pointer;
`;

export default CoinmarketFooter;
