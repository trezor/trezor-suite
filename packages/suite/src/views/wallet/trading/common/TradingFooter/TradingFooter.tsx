import { useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { Divider, Icon, Image, Link, Row, useElevation } from '@trezor/components';
import { useOnClickOutside } from '@trezor/react-utils';
import {
    Elevation,
    borders,
    mapElevationToBorder,
    spacingsPx,
    typography,
    zIndices,
} from '@trezor/theme';
import { DATA_TOS_INVITY_URL, INVITY_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';
import { TradingFooterLogoWrapper } from 'src/views/wallet/trading';
import { TradingProvidedByInvity } from 'src/views/wallet/trading/common/TradingFooter/TradingProvidedByInvity';

const Wrapper = styled.div`
    margin-top: ${spacingsPx.xxxl};
`;

const WrapperBorder = styled.div`
    padding-top: ${spacingsPx.lg};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.highlight}
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
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    z-index: ${zIndices.tooltip};

    background: ${({ theme }) => theme.backgroundNeutralBoldInverted};
    overflow: hidden;
`;

const Header = styled.div<{ $elevation: Elevation }>`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${mapElevationToBorder};
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
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body}
    margin-bottom: 15px;
`;

const linkStyle = css`
    color: ${({ theme }) => theme.textSubdued};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.textSubdued};
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

const FooterText = styled(Text)`
    padding-right: 10px;
`;

export const TradingFooter = () => {
    const { elevation } = useElevation();
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
                        <TradingProvidedByInvity />
                    </Left>
                    <Right>
                        {toggled && (
                            <FooterBox ref={menuRef}>
                                <Header $elevation={elevation}>
                                    <BoxLeft>
                                        <TradingFooterLogoWrapper>
                                            <Link href={INVITY_URL} target="_blank">
                                                <Image width={70} image="INVITY_LOGO" />
                                            </Link>
                                        </TradingFooterLogoWrapper>
                                    </BoxLeft>
                                    <BoxRight>
                                        <Link href={INVITY_URL}>invity.io</Link>
                                        <IconWrapper onClick={() => setToggled(false)}>
                                            <Icon name="x" size={16} />
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
                        <Divider
                            orientation="vertical"
                            margin={{ vertical: 0, horizontal: 8 }}
                            height={12}
                        />
                        <LearnMoreToggle ref={toggleRef} onClick={() => setToggled(true)}>
                            <Translation id="TR_BUY_LEARN_MORE" />
                        </LearnMoreToggle>
                    </Right>
                </Row>
            </WrapperBorder>
        </Wrapper>
    );
};
