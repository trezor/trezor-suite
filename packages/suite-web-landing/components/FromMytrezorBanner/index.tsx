import React from 'react';
import { Icon, colors, variables, Button, H1, H2 } from '@trezor/components';
import styled from 'styled-components';
import CollapsibleBox from '@suite-components/CollapsibleBox';
import Translation from '../Translation';

const FromMytrezorBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 60px;
    margin-bottom: -55px;
    border-radius: 40px;
    @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;
const BannerWrap = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-bottom: 30px;
    }
`;
const InnerWrap = styled.div`
    padding: 0 15px;
    margin-left: 10px;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 30px;
        margin: 0;
    }
`;
const BannerTitle = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;
const BannerDesc = styled.p`
    color: ${colors.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.H3};
`;

const CollapsibleBoxContent = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    margin-top: 20px;
    margin-bottom: 45px;
`;

const IconWrap = styled.div`
    width: 64px;
    min-width: 64px;
    height: 64px;
    border-radius: 16px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CollapsibleBoxContentHeadline = styled(H1)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: 32px;
    margin-bottom: 25px;
    &:not(:first-child) {
        margin-top: 40px;
    }
`;

const CollapsibleBoxContentP = styled.p`
    margin-bottom: 15px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.TYPE_LIGHT_GREY};
    font-size: 20px;
    line-height: 28px;
    & strong {
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        color: #141414;
    }
`;

const CollapsibleBoxContentSpan = styled.span`
    margin-bottom: 15px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.TYPE_LIGHT_GREY};
    font-size: 20px;
    line-height: 28px;
    & strong {
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        color: #141414;
    }
`;

const StyledCollapsibleBox = styled(CollapsibleBox)`
    width: 100%;
    box-shadow: none;
    border-radius: 40px;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        & > div:first-child {
            flex-direction: column;
            & > button {
                width: calc(100% - 60px);
                justify-content: space-between;
                padding: 0 15px;
            }
        }
        & ${IconWrap} {
            display: none;
        }
    }
`;

const StyledCollapsibleBoxLink = styled.span`
    color: ${colors.BG_GREEN};
    cursor: pointer;
    & :hover {
        text-decoration: underline;
    }
`;

const BoxCTA = styled(Button)`
    width: 163px;
    height: 60px;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    border-radius: 12px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
`;

const StyledFromMytrezorBanner = () => (
    <FromMytrezorBanner>
        <StyledCollapsibleBox
            variant="large"
            headingButton={({ collapsed, animatedIcon }) => (
                <BoxCTA
                    variant="tertiary"
                    onClick={() => (document.activeElement as HTMLElement).blur()}
                >
                    <Translation
                        id={
                            collapsed
                                ? 'TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR'
                                : 'TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR_WRAPUP'
                        }
                    />
                    <Icon
                        icon="ARROW_DOWN"
                        size={22}
                        canAnimate={animatedIcon}
                        isActive={!collapsed}
                    />
                </BoxCTA>
            )}
            heading={
                <>
                    <BannerWrap>
                        <IconWrap>
                            <Icon size={38} icon="TREZOR_LOGO" color="#fff" />
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
                <CollapsibleBoxContentP>
                    <Translation
                        id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_3"
                        values={{
                            strong: chunks => <strong>{chunks}</strong>,
                        }}
                    />
                </CollapsibleBoxContentP>

                <CollapsibleBoxContentHeadline>
                    <Translation id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_1" />
                </CollapsibleBoxContentHeadline>
                <CollapsibleBoxContentSpan>
                    <Translation
                        id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_4"
                        values={{
                            ul: chunks => <ul style={{ marginBottom: '15px' }}>{chunks}</ul>,
                            li: chunks => <li>{chunks}</li>,
                            strong: chunks => <strong>{chunks}</strong>,
                        }}
                    />
                </CollapsibleBoxContentSpan>

                <CollapsibleBoxContentHeadline>
                    <Translation id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_2" />
                </CollapsibleBoxContentHeadline>
                <CollapsibleBoxContentP>
                    <Translation
                        id="TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_5"
                        values={{
                            lineBreak: <br />,
                            StyledCollapsibleBoxLink: chunks => (
                                <StyledCollapsibleBoxLink
                                    onClick={() =>
                                        window.scrollTo({
                                            top: 0,
                                            left: 0,
                                            behavior: 'smooth',
                                        })
                                    }
                                >
                                    {chunks}
                                </StyledCollapsibleBoxLink>
                            ),
                        }}
                    />
                </CollapsibleBoxContentP>
            </CollapsibleBoxContent>
        </StyledCollapsibleBox>
    </FromMytrezorBanner>
);

export default StyledFromMytrezorBanner;
