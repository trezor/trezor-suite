import React, { useState } from 'react';
import styled from 'styled-components';
import { IntlProvider } from 'react-intl';
import Layout from '@suite-web-landing-components/Layout';
import Translation, { TranslationModeContext } from '@suite-web-landing-components/Translation';
import Download from '@suite-web-landing-components/Download';
import Feature from '@suite-web-landing-components/Feature';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { H1, P, variables, colors } from '@trezor/components';
import { Fade } from 'react-awesome-reveal';
import enLocale from '@trezor/suite-data/files/translations/en.json';

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
    em {
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

const TranslationModeTrigger = styled.div`
    position: fixed;
    width: 20px;
    height: 20px;
    left: 0px;
    bottom: 0px;
    /* background: red; */
`;

const features = [
    {
        id: 1,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_1_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_1_TEXT" />,
        backgroundPosition: 'bottom right',
        backgroundSize: '616px auto',
        soon: false,
    },
    {
        id: 2,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_2_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_2_TEXT" />,
        backgroundPosition: 'center left',
        backgroundSize: '489px auto',
        soon: true,
    },
    {
        id: 3,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_TEXT" />,
        backgroundSize: '500px auto',
        soon: false,
    },
];

const Index = () => {
    const [translationMode, setTranslationMode] = useState(false);

    return (
        <TranslationModeContext.Provider value={translationMode}>
            <IntlProvider locale="en" messages={enLocale}>
                <Layout>
                    <Wrapper>
                        <StyledHeroCta>
                            <Fade direction="up" delay={500} triggerOnce>
                                <StyledHeadline>
                                    <Translation
                                        id="TR_SUITE_WEB_LANDING_HEADLINE"
                                        values={{
                                            em: chunks => <em>{chunks}</em>,
                                            lineBreak: <br />,
                                        }}
                                    />
                                </StyledHeadline>
                            </Fade>
                            <Fade delay={1500} triggerOnce>
                                <StyledSubheadline>
                                    <Translation id="TR_SUITE_WEB_LANDING_SUB_HEADLINE" />
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
                                    image={resolveStaticPath(
                                        `images/suite-web-landing/feature${item.id}.png`,
                                    )}
                                    key={item.id}
                                    flip={key % 2 === 1}
                                    backgroundPosition={
                                        item.backgroundPosition !== undefined
                                            ? item.backgroundPosition
                                            : undefined
                                    }
                                    backgroundSize={item.backgroundSize}
                                >
                                    {item.soon && (
                                        <StyledSoon>
                                            <Translation id="TR_SUITE_WEB_LANDING_SUB_SOON" />
                                        </StyledSoon>
                                    )}
                                    <StyledH1>{item.headline}</StyledH1>
                                    <StyledP>{item.text}</StyledP>
                                </Feature>
                            ))}
                        </FeaturesWrapper>
                        <StyledCta>
                            <StyledHeadline size={44}>
                                <Translation
                                    id="TR_SUITE_WEB_LANDING_BOTTOM_HEADLINE"
                                    values={{
                                        em: chunks => <em>{chunks}</em>,
                                        lineBreak: <br />,
                                    }}
                                />
                            </StyledHeadline>
                            <DownloadWrapper>
                                <Download />
                            </DownloadWrapper>
                        </StyledCta>
                    </Wrapper>
                </Layout>
                <TranslationModeTrigger onClick={() => setTranslationMode(prev => !prev)} />
            </IntlProvider>
        </TranslationModeContext.Provider>
    );
};

export default Index;
