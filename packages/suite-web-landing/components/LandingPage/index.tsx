import styled from 'styled-components';
import { H1, P, variables, colors } from '@trezor/components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

export const StyledHeroCta = styled.header`
    text-align: center;
    z-index: 2;
`;

export const StyledCta = styled.div`
    text-align: center;
    justify-content: center;
    margin: 168px 0 140px;
`;

export const DownloadWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

export const FeaturesWrapper = styled.div`
    margin: 80px 0 0 0;
    & > section {
        margin-bottom: 50px;

        &:last-child {
            margin-bottom: 0;
        }
    }
`;

export const StyledH1 = styled(H1)`
    font-size: 28px;
    line-height: 36px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        font-size: 44px;
        line-height: 55px;
        white-space: pre-wrap;
    }
`;

export const StyledHeadline = styled(H1)<{ size?: number }>`
    font-size: 40px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    line-height: 1.3;
    margin-bottom: 18px;
    em {
        font-style: normal;
        color: ${colors.TYPE_GREEN};
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        font-size: ${props => (props.size !== undefined ? `${props.size}px` : '64px')};
    }
`;

export const StyledSubheadline = styled(P)`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.TYPE_LIGHT_GREY} !important;
    margin-bottom: 65px;
`;

export const StyledP = styled(P)`
    && {
        font-size: 20px;
        line-height: 34px;
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        color: ${colors.TYPE_LIGHT_GREY};
    }
`;

export const StyledSoon = styled.div`
    font-size: 16px;
    line-height: 24px;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    color: ${colors.TYPE_ORANGE};
`;

export const TranslationModeTrigger = styled.div`
    position: fixed;
    width: 20px;
    height: 20px;
    left: 0px;
    bottom: 0px;
    /* background: red; */
`;
