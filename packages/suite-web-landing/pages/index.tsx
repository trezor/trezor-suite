import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import Layout from '../components/Layout';
import Translation, { TranslationModeContext } from '../components/Translation';
import Download from '../components/Download';
import Feature from '../components/Feature';
import { resolveStaticPath } from '@trezor/utils/lib/resolveStaticPath';
import Metadata from '@suite-components/Metadata';
import { URLS } from '@suite-constants';
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
} from '../components/LandingPage';
import StyledFromMytrezorBanner from '../components/FromMytrezorBanner';
import { switchFavicon } from '../utils/switchFavicon';
import { useRouter } from 'next/router';

const features = [
    {
        id: 1,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_1_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_1_TEXT" />,
        backgroundPosition: 'bottom right',
        backgroundSize: 'auto 386px',
        soon: false,
    },
    {
        id: 2,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_2_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_2_TEXT" />,
        backgroundPosition: 'center left',
        backgroundSize: 'auto 409px',
        soon: false,
    },
    {
        id: 3,
        headline: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_HEADLINE" />,
        text: <Translation id="TR_SUITE_WEB_LANDING_FEATURES_3_TEXT" />,
        backgroundSize: 'auto 416px',
        backgroundPosition: 'center right',
        soon: false,
    },
];

const pathToApp = './web';

const Index = () => {
    const [translationMode, setTranslationMode] = useState(false);

    const router = useRouter();
    const { fromMytrezor } = router.query;
    const isFromMytrezor = fromMytrezor === 'true';

    useEffect(() => {
        switchFavicon();
    }, []);

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
                            <StyledHeadline>
                                <Translation
                                    id={
                                        isFromMytrezor
                                            ? 'TR_SUITE_WEB_LANDING_HEADLINE_FROM_MYTREZOR'
                                            : 'TR_SUITE_WEB_LANDING_HEADLINE'
                                    }
                                    values={{
                                        em: chunks => <em>{chunks}</em>,
                                        lineBreak: <br />,
                                    }}
                                />
                            </StyledHeadline>
                            <StyledSubheadline>
                                <Translation
                                    id={
                                        isFromMytrezor
                                            ? 'TR_SUITE_WEB_LANDING_SUB_HEADLINE_FROM_MYTREZOR'
                                            : 'TR_SUITE_WEB_LANDING_SUB_HEADLINE'
                                    }
                                />
                            </StyledSubheadline>
                            <DownloadWrapper>
                                <Download pathToApp={pathToApp} />
                            </DownloadWrapper>
                        </StyledHeroCta>

                        {isFromMytrezor && <StyledFromMytrezorBanner />}

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
