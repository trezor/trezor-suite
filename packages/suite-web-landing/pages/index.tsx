import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import Layout from '@suite-web-landing-components/Layout';
import Translation, { TranslationModeContext } from '@suite-web-landing-components/Translation';
import Download from '@suite-web-landing-components/Download';
import Feature from '@suite-web-landing-components/Feature';
import { resolveStaticPath } from '@suite-utils/nextjs';
import Metadata from '@suite-components/Metadata';
import { URLS } from '@suite-constants';
import { Fade } from 'react-awesome-reveal';
import enLocale from '@trezor/suite-data/files/translations/en.json';
import {
    Wrapper,
    StyledHeroCta,
    StyledCta,
    DownloadWrapper,
    FeaturesWrapper,
    StyledH1,
    StyledHeadline,
    StyledSubheadline,
    StyledP,
    StyledSoon,
    TranslationModeTrigger,
} from '@suite-web-landing-components/LandingPage';

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
        soon: false,
    },
    {
        id: 3,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_TEXT" />,
        backgroundSize: '500px auto',
        soon: false,
    },
];

const pathToApp = './web';

const Index = () => {
    const [translationMode, setTranslationMode] = useState(false);

    return (
        <TranslationModeContext.Provider value={translationMode}>
            <IntlProvider locale="en" messages={enLocale}>
                <Metadata
                    image={`${URLS.SUITE_URL}${resolveStaticPath(
                        'images/suite-web-landing/meta.png',
                    )}`}
                />
                <Layout pathToApp={pathToApp}>
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
                                    <Download pathToApp={pathToApp} />
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
                                <Download pathToApp={pathToApp} />
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
