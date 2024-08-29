import React, { useState } from 'react';
import styled from 'styled-components';

import { EventType, analytics } from '@trezor/suite-analytics';
import { TREZOR_SAFE_5_URL } from '@trezor/urls';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDashboardT3T1PromoBannerShown } from 'src/reducers/suite/suiteReducer';
import { Button, IconButton, Image, SVG_IMAGES, SVG_PATH, variables } from '@trezor/components';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation, TrezorLink } from 'src/components/suite';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { colorVariants } from '@trezor/theme';
import { rgba } from 'polished';
import { T3T1PromoLogo } from './T3T1PromoLogo';
import { bannerAnimationConfig } from './banner-animations';

const BannerWrapper = styled(motion.div)`
    display: grid;
    grid-template-columns: 520px 1fr minmax(142px, 145px) 42px;
    grid-template-rows: 42px 1fr 0;
    column-gap: 8px;
    background-color: ${colorVariants.standard.backgroundPrimaryDefault};
    height: 168px;
    width: 100%;
    border-radius: 12px;
    padding-left: 24px;
    padding-right: 24px;
    overflow: hidden;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        grid-template-columns: 370px 1fr minmax(142px, 145px) 42px;
        padding-left: 12px;
        padding-right: 12px;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        height: 190px;
        grid-template-columns: 340px 1fr 0 32px;
        grid-template-rows: 36px 1fr 36px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        height: 240px;
        padding-left: 8px;
        padding-right: 8px;
        grid-template-columns: 260px 1fr 0 32px;
    }
`;

const NextGenerationText = styled.p`
    grid-column: 1;
    grid-row: 2;

    margin-bottom: 24px;
    align-self: end;

    position: relative;
    font-size: 32px;
    letter-spacing: -0.65px;
    line-height: 34.6px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    z-index: 1;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        font-size: 28px;
        line-height: 30px;
        margin-bottom: 16px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        align-self: end;
        margin-bottom: 18px;
    }
`;

const NextGenerationTextBlock = styled.span`
    color: ${colorVariants.standard.textOnPrimary};
`;

const imgUrl = resolveStaticPath(`${SVG_PATH}/${SVG_IMAGES.TREZOR_SAFE_PROMO_UNDERLINE}`);

const NextGenerationTextBlockHighlight = styled(NextGenerationTextBlock)`
    color: #9be887;
    white-space: nowrap;
    background-image: url(${imgUrl});
    display: inline-block;
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100%;
`;

const NextGenerationTextBlockSecurity = styled(NextGenerationTextBlock)``;

const ProductsImageWrapper = styled.div`
    grid-column: 2;
    grid-row: 1 / 3;
    position: relative;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        z-index: 0;
        grid-row-end: 4;
    }
`;

const ProductsImage = styled(Image)`
    position: absolute;
    max-width: none;
    filter: none;
    height: 200px;
    bottom: -45px;
    right: 30px;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        right: 0;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        right: 10px;
        bottom: -80px;
        height: 220px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        right: 10px;
        bottom: -40px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        right: -44px;
        bottom: -34px;
    }
`;

const LinkButtonShopNow = styled(TrezorLink)`
    grid-column: 3;
    grid-row: 2;
    height: 42px;
    margin-bottom: 24px;
    align-self: end;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 1;
        grid-row: 3;
        width: 145px;
        height: 36px;
        margin-bottom: 12px;
    }
`;

const ButtonShopNow = styled(Button)`
    background-color: #9be887;
    width: 100%;
    height: 100%;
    z-index: 1;
    color: black;

    &:hover,
    &:focus {
        background-color: #7cba6c;
    }
`;

const ButtonClose = styled(IconButton)`
    grid-column: 4;
    grid-row: 2;
    margin-bottom: 24px;
    align-self: end;
    z-index: 1;

    /* stylelint-disable color-function-notation */
    background: ${rgba(colorVariants.standard.textOnPrimary, 0.16)};
    /* stylelint-enable color-function-notation */
    height: 42px;
    width: 42px;

    &:hover,
    &:focus {
        background: #0b4936;
    }

    svg {
        height: 24px;
        width: 24px;
        fill: ${colorVariants.standard.textOnPrimary};
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 4;
        grid-row: 1;
        align-self: auto;
        margin-bottom: 0;
        margin-top: 12px;
        height: 31px;
        width: 31px;

        svg {
            height: 17px;
            width: 17px;
        }
    }
`;

export const T3T1PromoBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    const dispatch = useDispatch();

    const shouldShowDashboardT3T1PromoBanner = useSelector(selectIsDashboardT3T1PromoBannerShown);

    const onCloseBanner = () => {
        analytics.report({
            type: EventType.T3T1DashboardPromo,
            payload: {
                action: 'close',
            },
        });
        setIsVisible(false);
    };

    const onPreorderNow = () =>
        analytics.report({
            type: EventType.T3T1DashboardPromo,
            payload: {
                action: 'preorder',
            },
        });

    if (!shouldShowDashboardT3T1PromoBanner) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <BannerWrapper
                    key="container"
                    {...bannerAnimationConfig}
                    onAnimationComplete={() =>
                        dispatch(setFlag('showDashboardT3T1PromoBanner', false))
                    }
                >
                    <T3T1PromoLogo />
                    <NextGenerationText>
                        <Translation
                            id="TR_PROMO_BANNER_DASHBOARD"
                            values={{
                                underline: text => (
                                    <NextGenerationTextBlockHighlight>
                                        {text}
                                    </NextGenerationTextBlockHighlight>
                                ),
                                rest: text => (
                                    <NextGenerationTextBlockSecurity>
                                        {text}
                                    </NextGenerationTextBlockSecurity>
                                ),
                            }}
                            isNested={true}
                        />
                    </NextGenerationText>
                    <ProductsImageWrapper>
                        <ProductsImage image="TREZOR_SAFE_PROMO_PRODUCTS" />
                    </ProductsImageWrapper>
                    <LinkButtonShopNow
                        href={TREZOR_SAFE_5_URL}
                        variant="nostyle"
                        onClick={onPreorderNow}
                    >
                        <ButtonShopNow variant="secondary">
                            <Translation id="TR_ORDER_NOW" />
                        </ButtonShopNow>
                    </LinkButtonShopNow>
                    <ButtonClose icon="close" variant="secondary" onClick={onCloseBanner} />
                </BannerWrapper>
            )}
        </AnimatePresence>
    );
};
