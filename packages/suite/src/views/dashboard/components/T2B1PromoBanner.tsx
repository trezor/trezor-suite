import React, { useState } from 'react';
import styled from 'styled-components';
import { rgba } from 'polished';

import { EventType, analytics } from '@trezor/suite-analytics';
import { TREZOR_URL } from '@trezor/urls';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDashboardT2B1PromoBannerShown } from 'src/reducers/suite/suiteReducer';
import { Button, Image, SVG_IMAGES, SVG_PATH, motionEasing, variables } from '@trezor/components';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation, TrezorLink } from 'src/components/suite';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveStaticPath } from '@suite-common/suite-utils';

const BannerWrapper = styled(motion.div)`
    display: grid;
    grid-template-columns: 338px 1fr minmax(109px, 145px) 42px;
    grid-template-rows: 42px 1fr 0;
    column-gap: 8px;
    background-color: #0f6148;
    height: 168px;
    width: 100%;
    border-radius: 12px;
    margin-top: 16px;
    padding-left: 24px;
    padding-right: 24px;
    overflow: hidden;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        height: 132px;
        padding-left: 12px;
        padding-right: 12px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        height: 190px;
        grid-template-columns: 171px 1fr 0 32px;
        grid-template-rows: 36px 1fr 36px;
    }
`;

const TrezorSafe3Logo = styled(Image)`
    grid-column: 1;
    grid-row: 1;
    height: fit-content;
    filter: none;

    padding-top: 28px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding-top: 16px;
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

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        font-size: 24px;
        line-height: 26px;
        margin-bottom: 16px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        align-self: end;
        margin-bottom: 18px;
    }
`;

const NextGenerationTextBlock = styled.span`
    color: ${({ theme }) => theme.TYPE_WHITE};
`;

const NextGenerationTextBlockHighlight = styled(NextGenerationTextBlock)`
    color: #9be887;
    white-space: nowrap;
    background-image: url(${resolveStaticPath(
        `${SVG_PATH}/${SVG_IMAGES.TREZOR_SAFE_PROMO_UNDERLINE}`,
    )});
    display: inline-block;
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100%;
`;

const NextGenerationTextBlockSecurity = styled(NextGenerationTextBlock)`
    white-space: nowrap;
`;

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
    height: 481px;
    bottom: -200px;
    right: -175px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        right: -145px;
        bottom: -162px;
        height: 390px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        right: -207px;
        bottom: -138px;
    }
`;

const LinkButtonShopNow = styled(TrezorLink)`
    grid-column: 3;
    grid-row: 2;
    height: 42px;
    margin-bottom: 24px;
    align-self: end;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin-bottom: 16px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-column: 1;
        grid-row: 3;
        width: 128px;
        height: 36px;
        margin-bottom: 12px;
    }
`;

const ButtonShopNow = styled(Button)`
    background-color: #9be887;
    width: 100%;
    height: 100%;

    color: black;

    :hover {
        background-color: #7cba6c;
    }
`;

const ButtonClose = styled(Button)`
    grid-column: 4;
    grid-row: 2;
    margin-bottom: 24px;
    align-self: end;
    z-index: 1;

    /* stylelint-disable color-function-notation */
    background: ${({ theme }) => rgba(theme.TYPE_WHITE, 0.16)};
    /* stylelint-enable color-function-notation */
    height: 42px;
    width: 42px;

    :hover {
        background: #0b4936;
    }

    svg {
        height: 24px;
        width: 24px;
        fill: ${({ theme }) => theme.TYPE_WHITE};
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin-bottom: 16px;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
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

export const T2B1PromoBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    const dispatch = useDispatch();

    const shouldShowDashboardT2B1PromoBanner = useSelector(selectIsDashboardT2B1PromoBannerShown);

    const onCloseBanner = () => {
        analytics.report({
            type: EventType.T2B1DashboardPromo,
            payload: {
                action: 'close',
            },
        });
        setIsVisible(false);
    };

    const onShopNow = () =>
        analytics.report({
            type: EventType.T2B1DashboardPromo,
            payload: {
                action: 'shop',
            },
        });

    const promoBannerAnimationConfig = {
        initial: { opacity: 1, transform: 'scale(1)', marginBottom: -18 },
        exit: { opacity: 0, transform: 'scale(0.7)', marginBottom: -184 },
        transition: {
            duration: 0.33,
            ease: motionEasing.transition,
            height: {
                duration: 0.23,
                ease: motionEasing.transition,
            },
            opacity: {
                duration: 0.23,
                ease: motionEasing.transition,
            },
        },
    };

    if (!shouldShowDashboardT2B1PromoBanner) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <BannerWrapper
                    key="container"
                    {...promoBannerAnimationConfig}
                    onAnimationComplete={() =>
                        dispatch(setFlag('showDashboardT2B1PromoBanner', false))
                    }
                >
                    <TrezorSafe3Logo image="TREZOR_SAFE_PROMO_LOGO" />
                    <NextGenerationText>
                        <NextGenerationTextBlock>Get the </NextGenerationTextBlock>
                        <NextGenerationTextBlockHighlight>
                            next-generation
                        </NextGenerationTextBlockHighlight>
                        <NextGenerationTextBlockSecurity>
                            of security today
                        </NextGenerationTextBlockSecurity>
                    </NextGenerationText>
                    <ProductsImageWrapper>
                        <ProductsImage image="TREZOR_SAFE_PROMO_PRODUCTS" />
                    </ProductsImageWrapper>
                    <LinkButtonShopNow href={TREZOR_URL} variant="nostyle" onClick={onShopNow}>
                        <ButtonShopNow variant="secondary">
                            <Translation id="TR_SHOP_NOW" />
                        </ButtonShopNow>
                    </LinkButtonShopNow>
                    <ButtonClose
                        icon="CROSS_LIGHT"
                        color="white"
                        variant="secondary"
                        onClick={onCloseBanner}
                    />
                </BannerWrapper>
            )}
        </AnimatePresence>
    );
};
