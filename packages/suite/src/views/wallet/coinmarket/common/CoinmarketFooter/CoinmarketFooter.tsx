import { variables, Icon, Link, Image, Row } from '@trezor/components';
import { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { useOnClickOutside } from '@trezor/react-utils';
import { DATA_TOS_INVITY_URL, INVITY_URL } from '@trezor/urls';
import { Translation } from 'src/components/suite';
import { borders, spacings, spacingsPx, zIndices } from '@trezor/theme';
import { CoinmarketFooterLogoWrapper } from 'src/views/wallet/coinmarket';
import { CoinmarketProvidedByInvity } from 'src/views/wallet/coinmarket/common/CoinmarketFooter/CoinmarketProvidedByInvity';

const Wrapper = styled.div`
    margin-top: ${spacingsPx.xxxl};
    padding: ${spacings.zero} ${spacingsPx.lg};
`;

const WrapperBorder = styled.div`
    padding-top: ${spacingsPx.lg};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    position: relative;
    justify-content: flex-end;
`;

const FooterBox = styled.div`
    position: absolute;
    border-radius: ${borders.radii.xs};
    padding: 10px;
    flex: 1;
    min-width: 345px;
    bottom: 30px;
    box-shadow: 0 1px 2px 0 ${({ theme }) => theme.legacy.BOX_SHADOW_BLACK_20};
    z-index: ${zIndices.tooltip};

    background: ${({ theme }) => theme.legacy.BG_WHITE};
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

const BoxLeft = styled.div``;
const BoxRight = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    cursor: pointer;
    margin-left: 10px;
`;

const Text = styled.div`
    padding-left: 10px;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 15px;
`;

const linkStyle = css`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
        text-decoration: underline;
    }
`;

// reason: different design then basic Link
// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLink = styled(Link)`
    ${linkStyle}
`;

const LearnMoreToggle = styled.div`
    ${linkStyle}
`;

const VerticalDivider = styled.div`
    height: 12px;
    border-left: 1px solid ${({ theme }) => theme.legacy.TYPE_LIGHTER_GREY};
    margin: 0 8px;
`;

const FooterText = styled(Text)`
    padding-right: 10px;
`;

export const CoinmarketFooter = () => {
    const [toggled, setToggled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLDivElement>(null);

    useOnClickOutside([menuRef, toggleRef], () => {
        if (toggled) {
            setToggled(false);
        }
    });

    return (
        <Wrapper>
            <WrapperBorder>
                <Row justifyContent="center">
                    <Left>
                        <CoinmarketProvidedByInvity />
                    </Left>
                    <Right>
                        {toggled && (
                            <FooterBox ref={menuRef}>
                                <Header>
                                    <BoxLeft>
                                        <CoinmarketFooterLogoWrapper>
                                            <Link href={INVITY_URL} target="_blank">
                                                <Image width={70} image="INVITY_LOGO" />
                                            </Link>
                                        </CoinmarketFooterLogoWrapper>
                                    </BoxLeft>
                                    <BoxRight>
                                        <Link href={INVITY_URL}>invity.io</Link>
                                        <IconWrapper onClick={() => setToggled(false)}>
                                            <Icon name="close" size={16} />
                                        </IconWrapper>
                                    </BoxRight>
                                </Header>
                                <FooterText>
                                    <Translation id="TR_BUY_FOOTER_TEXT_1" />
                                </FooterText>
                                <FooterText>
                                    <Translation id="TR_BUY_FOOTER_TEXT_2" />
                                </FooterText>
                            </FooterBox>
                        )}

                        <StyledLink href={DATA_TOS_INVITY_URL} variant="nostyle">
                            <Translation id="TR_TERMS_OF_USE_INVITY" />
                        </StyledLink>
                        <VerticalDivider />
                        <LearnMoreToggle ref={toggleRef} onClick={() => setToggled(true)}>
                            <Translation id="TR_BUY_LEARN_MORE" />
                        </LearnMoreToggle>
                    </Right>
                </Row>
            </WrapperBorder>
        </Wrapper>
    );
};
