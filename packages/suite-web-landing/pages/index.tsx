import React from 'react';
import styled from 'styled-components';
import Layout from '@suite-web-landing-components/Layout';
import Download from '@suite-web-landing-components/Download';
import Feature from '@suite-web-landing-components/Feature';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { H1, P, variables, colors } from '@trezor/components';
import { Fade } from 'react-awesome-reveal';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const StyledHeroCta = styled.header`
    text-align: center;
    z-index: 1;
`;

const StyledCta = styled.div`
    text-align: center;
    justify-content: center;
    margin: 168px 0 140px;
`;

const DownloadWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const FeaturesWrapper = styled.div`
    margin: 80px 0 0 0;
    & > section {
        margin-bottom: 50px;

        &:last-child {
            margin-bottom: 0;
        }
    }
`;

const StyledH1 = styled(H1)`
    font-size: 28px;
    line-height: 36px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        font-size: 44px;
        line-height: 55px;
        white-space: pre-wrap;
    }
`;

const StyledHeadline = styled(H1)<{ size?: number }>`
    font-size: 40px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    line-height: 1.3;
    margin-bottom: 18px;
    & > em {
        font-style: normal;
        color: ${colors.NEUE_TYPE_GREEN};
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        font-size: ${props => (props.size !== undefined ? `${props.size}px` : '64px')};
    }
`;

const StyledSubheadline = styled(P)`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK50} !important;
    margin-bottom: 65px;
`;

const StyledP = styled(P)`
    && {
        font-size: 20px;
        line-height: 34px;
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        color: ${colors.BLACK50};
    }
`;

const StyledSoon = styled.div`
    font-size: 16px;
    line-height: 24px;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    color: ${colors.NEUE_TYPE_ORANGE};
`;

const features = [
    {
        id: 1,
        headline: 'Desktop app',
        text:
            'Enhanced security and privacy, new design and improved performance, all in one software suite.',
        backgroundPosition: 'bottom right',
        backgroundSize: '616px auto',
        soon: false,
    },
    {
        id: 2,
        headline: 'Buy and exchange crypto',
        text:
            "Compare competitive rates, buy and exchange coins within Trezor's secure environment. Powered by +Invity.",
        backgroundPosition: 'center left',
        backgroundSize: '489px auto',
        soon: true,
    },
    {
        id: 3,
        headline: 'Native altcoin support',
        text: 'ETH, XRP, ETC and more now supported \ndirectly through the app.',
        backgroundSize: '500px auto',
        soon: false,
    },
];

const Index = () => (
    <Layout>
        <Wrapper>
            <StyledHeroCta>
                <Fade direction="up" delay={500} triggerOnce>
                    <StyledHeadline>
                        Managing crypto just got
                        <br />
                        <em>safer and easier</em>
                    </StyledHeadline>
                </Fade>
                <Fade delay={1500} triggerOnce>
                    <StyledSubheadline>
                        Take control of your Trezor with our desktop & browser app.
                    </StyledSubheadline>
                </Fade>
                <DownloadWrapper>
                    <Fade delay={2000} triggerOnce>
                        <Download />
                    </Fade>
                </DownloadWrapper>
            </StyledHeroCta>
            <FeaturesWrapper>
                {features.map((item, key) => (
                    <Feature
                        image={resolveStaticPath(`images/suite-web-landing/feature${item.id}.png`)}
                        key={item.id}
                        flip={key % 2 === 1}
                        backgroundPosition={
                            item.backgroundPosition !== undefined
                                ? item.backgroundPosition
                                : undefined
                        }
                        backgroundSize={item.backgroundSize}
                    >
                        {item.soon && <StyledSoon>Soon</StyledSoon>}
                        <StyledH1>{item.headline}</StyledH1>
                        <StyledP>{item.text}</StyledP>
                    </Feature>
                ))}
            </FeaturesWrapper>
            <StyledCta>
                <StyledHeadline size={44}>
                    Dozens of <em>brand-new features</em> to discover.
                    <br />
                    Try Suite now.
                </StyledHeadline>
                <DownloadWrapper>
                    <Download />
                </DownloadWrapper>
            </StyledCta>
        </Wrapper>
    </Layout>
);

export default Index;
