import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import Layout from '@suite-web-landing-components/Layout';
import Translation, { TranslationModeContext } from '@suite-web-landing-components/Translation';
import Download from '@suite-web-landing-components/Download';
import Feature from '@suite-web-landing-components/Feature';
import { resolveStaticPath } from '@suite-utils/build';
import Metadata from '@suite-components/Metadata';
import CollapsibleBox from '@suite-components/CollapsibleBox';
import { URLS } from '@suite-constants';
import enLocale from '@trezor/suite-data/files/translations/en.json';
import styled from 'styled-components';
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
    FromMytrezorBanner,
    BannerWrap,
    InnerWrap,
    BannerTitle,
    BannerDesc,
    CollapsibleBoxContent,
    CollapsibleBoxContentHeadline,
    CollapsibleBoxContentP,
    IconWrap,
} from '@suite-web-landing-components/LandingPage';
import { switchFavicon } from '../utils/switchFavicon';
import { refFromMytrezor } from '../utils/refFromMytrezor';
import { Icon, colors } from '@trezor/components';

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

const StyledCollapsibleBox = styled(CollapsibleBox)`
    width: 100%;
`;

const StyledCollapsibleBoxLink = styled.span`
    color: ${colors.BG_GREEN};
    cursor: pointer;
    & :hover {
        text-decoration: underline;
    }
`;

const pathToApp = './web';

const Index = () => {
    const [translationMode, setTranslationMode] = useState(false);
    const [fromMytrezor, setFromMytrezor] = useState(false);
    const ref = React.createRef<HTMLDivElement>();

    useEffect(() => {
        switchFavicon();
        setFromMytrezor(refFromMytrezor());
    }, []);

    const isFromMytrezor = fromMytrezor === true;

    return (
        <TranslationModeContext.Provider value={translationMode}>
            <IntlProvider locale="en" messages={enLocale}>
                <Metadata
                    image={`${URLS.SUITE_URL}${resolveStaticPath(
                        'images/suite-web-landing/meta.png',
                    )}`}
                />
                <Layout pathToApp={pathToApp}>
                    <Wrapper ref={ref}>
                        <StyledHeroCta>
                            <StyledHeadline>
                                {isFromMytrezor ? (
                                    <Translation
                                        id="TR_SUITE_WEB_LANDING_HEADLINE_FROM_MYTREZOR"
                                        values={{
                                            em: chunks => <em>{chunks}</em>,
                                            lineBreak: <br />,
                                        }}
                                    />
                                ) : (
                                    <Translation
                                        id="TR_SUITE_WEB_LANDING_HEADLINE"
                                        values={{
                                            em: chunks => <em>{chunks}</em>,
                                            lineBreak: <br />,
                                        }}
                                    />
                                )}
                            </StyledHeadline>
                            <StyledSubheadline>
                                <Translation id="TR_SUITE_WEB_LANDING_SUB_HEADLINE" />
                            </StyledSubheadline>
                            <DownloadWrapper>
                                <Download pathToApp={pathToApp} />
                            </DownloadWrapper>
                        </StyledHeroCta>

                        {isFromMytrezor && (
                            <FromMytrezorBanner>
                                <StyledCollapsibleBox
                                    variant="large"
                                    withButton
                                    disableShadow
                                    heading={
                                        <>
                                            <BannerWrap>
                                                <IconWrap>
                                                    <Icon
                                                        size={38}
                                                        icon="TREZOR_LOGO"
                                                        color="#fff"
                                                    />
                                                </IconWrap>
                                                <InnerWrap>
                                                    <BannerTitle>
                                                        <Translation id="TR_SUITE_WEB_LANDING_BANNER_HEADLINE_FROM_MYTREZOR" />
                                                    </BannerTitle>
                                                    <BannerDesc>
                                                        <Translation id="TR_SUITE_WEB_LANDING_BANNER_DESC_FROM_MYTREZOR" />
                                                    </BannerDesc>
                                                </InnerWrap>
                                            </BannerWrap>
                                        </>
                                    }
                                >
                                    <CollapsibleBoxContent>
                                        <CollapsibleBoxContentHeadline>
                                            <Translation id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_0" />
                                        </CollapsibleBoxContentHeadline>
                                        <CollapsibleBoxContentP>
                                            <Translation
                                                id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_0"
                                                values={{
                                                    strong: chunks => <strong>{chunks}</strong>,
                                                }}
                                            />
                                        </CollapsibleBoxContentP>
                                        <CollapsibleBoxContentP>
                                            <Translation
                                                id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_1"
                                                values={{
                                                    strong: chunks => <strong>{chunks}</strong>,
                                                }}
                                            />
                                        </CollapsibleBoxContentP>
                                        <CollapsibleBoxContentP>
                                            <Translation
                                                id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_2"
                                                values={{
                                                    strong: chunks => <strong>{chunks}</strong>,
                                                }}
                                            />
                                        </CollapsibleBoxContentP>

                                        <CollapsibleBoxContentHeadline>
                                            <Translation id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_1" />
                                        </CollapsibleBoxContentHeadline>
                                        <CollapsibleBoxContentP>
                                            <Translation
                                                id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_3"
                                                values={{
                                                    strong: chunks => <strong>{chunks}</strong>,
                                                }}
                                            />
                                        </CollapsibleBoxContentP>

                                        <CollapsibleBoxContentHeadline>
                                            <Translation id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_2" />
                                        </CollapsibleBoxContentHeadline>
                                        <CollapsibleBoxContentP>
                                            We recommend to{' '}
                                            <StyledCollapsibleBoxLink
                                                onClick={() =>
                                                    ref?.current?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.scrollTo(
                                                        {
                                                            top: 0,
                                                            behavior: 'smooth',
                                                        },
                                                    )
                                                }
                                            >
                                                download Trezor Suite for desktop
                                            </StyledCollapsibleBoxLink>
                                            , to isolate your activity and protect from phishing.
                                            You can also use the web app and enjoy the same core
                                            functionality, but you will not be able to use more
                                            advanced features like Tor.
                                        </CollapsibleBoxContentP>
                                    </CollapsibleBoxContent>
                                </StyledCollapsibleBox>
                            </FromMytrezorBanner>
                        )}

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
