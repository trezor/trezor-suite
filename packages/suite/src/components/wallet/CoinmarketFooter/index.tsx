import { variables, Icon, Button, Link } from '@trezor/components';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { CoinmarketProvidedByInvity } from '@wallet-components';
import { useOnClickOutside } from '@suite-utils/dom';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/build';
import { URLS } from '@suite-constants';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex: 1;
    justify-content: center;
    align-items: center;
    padding-top: 20px;
    margin-top: 60px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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
    box-shadow: 0 1px 2px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    z-index: 1;

    background: ${props => props.theme.BG_WHITE};
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const BoxLeft = styled.div``;
const BoxRight = styled.div`
    display: flex;
    align-items: center;
`;

const Image = styled.img`
    width: 70px;
`;

const StyledLink = styled(Link)`
    display: flex;
    flex: 1;
    padding-top: 1px;
    align-items: center;
`;

const IconWrapper = styled.div`
    cursor: pointer;
    margin-left: 10px;
`;

const Text = styled.div`
    padding-left: 10px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 15px;
`;

const Toggle = styled.div`
    cursor: pointer;
`;

const VerticalDivider = styled.div`
    border-left: 1px solid ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 0 8px;
`;

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
                <CoinmarketProvidedByInvity />
            </Left>
            <Right>
                {toggled && (
                    <FooterBox ref={menuRef}>
                        <Header>
                            <BoxLeft>
                                <StyledLink href="https://invity.io/">
                                    <Image src={resolveStaticPath('/images/svg/invity-logo.svg')} />
                                </StyledLink>
                            </BoxLeft>
                            <BoxRight>
                                <Link href="https://invity.io/">
                                    <Button variant="tertiary">invity.io</Button>
                                </Link>
                                <IconWrapper onClick={() => setToggled(false)}>
                                    <Icon icon="CROSS" size={16} />
                                </IconWrapper>
                            </BoxRight>
                        </Header>
                        <Text>
                            <Translation id="TR_BUY_FOOTER_TEXT_1" />
                        </Text>
                        <Text>
                            <Translation id="TR_BUY_FOOTER_TEXT_2" />
                        </Text>
                    </FooterBox>
                )}
                <Link href={URLS.TOS_INVITY_URL} variant="nostyle">
                    <Translation id="TR_TERMS_OF_USE_INVITY" />
                </Link>
                <VerticalDivider />
                <Toggle ref={toggleRef} onClick={() => setToggled(true)}>
                    <Translation id="TR_BUY_LEARN_MORE" />
                </Toggle>
            </Right>
        </Wrapper>
    );
};

export default CoinmarketFooter;
