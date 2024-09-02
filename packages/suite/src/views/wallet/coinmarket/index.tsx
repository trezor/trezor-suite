import styled from 'styled-components';
import {
    variables,
    SelectBar,
    Paragraph,
    TextButton,
    H2,
    Card,
    Spinner,
    Icon,
} from '@trezor/components';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    nativeTypography,
    nextElevation,
    spacings,
    spacingsPx,
    typography,
} from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { Margin } from 'recharts/types/util/types';

interface ResponsiveSize {
    $responsiveSize: keyof typeof variables.SCREEN_SIZE;
}

export const CoinmarketWrapper = `
    display: flex;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xxxl};

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        flex-wrap: wrap;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const CoinmarketLeftWrapper = styled(Card)<{ $isWithoutPadding?: boolean }>`
    padding: ${({ $isWithoutPadding }) =>
        $isWithoutPadding ? 0 : `${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.lg}`};
    width: 60%;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md};
        width: 49%;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        padding-bottom: ${spacingsPx.zero};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const CoinmarketRightWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxxl};
    width: 37%;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.xxl};
        width: 49%;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        margin-top: ${spacingsPx.sm};
    }
`;

export const Wrapper = styled.div<ResponsiveSize>`
    display: flex;
    flex: 1;

    @media screen and (min-width: ${props => variables.SCREEN_SIZE[props.$responsiveSize]}) {
        flex-flow: wrap;
    }

    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.$responsiveSize]}) {
        flex-direction: column;
    }
`;

export const FullWidthForm = styled.form`
    width: 100%;
`;

export const Left = styled.div`
    display: flex;
    flex: 1;
`;

export const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

export const Middle = styled.div<ResponsiveSize>`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.$responsiveSize]}) {
        padding-bottom: 27px;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const StyledIcon = styled(Icon)<ResponsiveSize>`
    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.$responsiveSize]}) {
        transform: rotate(90deg);
    }
`;

export const FeesWrapper = styled.div`
    margin: 25px 0;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

export const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

export const FooterWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-top: 30px;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const StyledSelectBar = styled(SelectBar)`
    width: 100%;

    & div div {
        justify-content: center;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const CoinmarketParagraph = styled(Paragraph)`
    text-align: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

export const CoinmarketFormInput = styled.div<{ $isWithoutPadding?: boolean }>`
    position: relative;
    padding-bottom: ${({ $isWithoutPadding }) =>
        $isWithoutPadding ? spacings.zero : spacingsPx.md};

    input {
        color: ${({ theme }) => theme.textSubdued};
    }
`;

export const CoinmarketFormInputInner = styled.div`
    position: relative;
`;

export const CoinmarketFormInputLabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xs};
`;

export const CoinmarketFormInputLabelText = styled.label`
    ${typography.body}
`;

export const CoinmarketFormOption = styled.div`
    display: flex;
    align-items: center;
`;

export const CoinmarketFormOptionGroupLabel = styled.div`
    color: ${({ theme }) => theme.textSubdued};
`;

export const CoinmarketFormOptionLabel = styled.div<{ $isDark?: boolean }>`
    color: ${({ theme, $isDark }) => ($isDark ? theme.textDefault : theme.textSubdued)};
`;

export const CoinmarketFormOptionLabelLong = styled.div`
    padding-left: ${spacingsPx.sm};
    padding-top: ${spacingsPx.xxxs};
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

export const CoinmarketFormOptionNetwork = styled.div<{ $elevation: Elevation }>`
    padding: 2px 6px;
    margin-left: 10px;
    font-size: ${nativeTypography.label.fontSize}px;
    background: ${({ theme, $elevation }) =>
        mapElevationToBackground({ theme, $elevation: nextElevation[$elevation] })};
    border-radius: 4px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const CoinmarketTextButton = styled(TextButton)`
    position: relative;
    padding: 0;
`;

export const CoinmarketAmountContainer = styled.div`
    display: flex;
    align-items: center;
    margin-top: ${spacingsPx.md};

    ${SCREEN_QUERY.MOBILE} {
        margin-top: ${spacingsPx.xs};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const CoinmarketAmountWrapper = styled(H2)`
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        font-size: 28px;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        font-size: ${nativeTypography.titleMedium.fontSize}px;
    }

    ${SCREEN_QUERY.MOBILE} {
        font-size: ${nativeTypography.titleSmall.fontSize}px;
        margin-top: ${spacingsPx.xs};
    }
`;

export const CoinmarketAmountWrapperText = styled.div`
    padding-right: ${spacingsPx.xs};
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const CoinmarketInfoLeftColumn = styled.div`
    display: flex;
    flex: 1;
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

export const CoinmarketInfoRightColumn = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
    flex: 1;
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
`;

export const CoinmarketInfoAmount = styled.div`
    padding-left: ${spacingsPx.xs};
`;

export const CoinmarketBorder = styled.div<{ $margin?: Margin }>`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.borderElevation1};
    ${({ $margin }) =>
        `margin: ${$margin?.top ?? spacings.zero}px ${$margin?.right ?? spacings.zero}px ${$margin?.bottom ?? spacings.zero}px ${$margin?.left ?? spacings.zero}px`};
`;

export const CoinmarketFormOfferSpinnerWrapper = styled.div`
    width: 100%;
    padding: ${spacingsPx.sm} 0;
`;

export const CoinmarketFormOfferSpinnerText = styled.div<{ $withoutSpinner?: boolean }>`
    ${({ $withoutSpinner }) => ($withoutSpinner ? typography.label : typography.hint)}
    color: ${({ theme, $withoutSpinner }) =>
        $withoutSpinner ? theme.textDefault : theme.textSubdued};
    text-align: center;
`;

export const CoinmarketSpinnerWrapper = styled(Spinner)`
    flex: none;
    margin: 0 ${spacingsPx.xs};
`;

export const TooltipWrap = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};

    &:hover {
        div {
            color: ${({ theme }) => theme.textDefault};

            &::after {
                background: ${({ theme }) => theme.textDefault};
            }
        }

        path[fill] {
            fill: ${({ theme }) => theme.textDefault};
        }

        path[stroke] {
            stroke: ${({ theme }) => theme.textDefault};
        }
    }
`;

export const TooltipIcon = styled.div`
    margin-top: 1px;
    margin-right: ${spacingsPx.xs};
`;

export const TooltipText = styled.div<{ $isYellow?: boolean }>`
    position: relative;
    ${typography.hint}
    color: ${({ $isYellow, theme }) => ($isYellow ? theme.textAlertYellow : theme.textDefault)};
    transition: color 0.15s;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: ${({ $isYellow, theme }) =>
            $isYellow ? theme.textAlertYellow : theme.textDefault};
        transition: background 0.15s;
    }
`;

export const CoinmarketWarning = styled.div`
    padding: ${spacingsPx.sm};
    border: 1px solid ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevationNegative};
    border-radius: ${borders.radii.sm};
    background-color: ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation1};
`;

export const CoinmarketTestWrapper = styled.div``;
