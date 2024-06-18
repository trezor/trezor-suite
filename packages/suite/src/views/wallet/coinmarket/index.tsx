import styled from 'styled-components';
import { Icon, variables, SelectBar, Paragraph } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

interface ResponsiveSize {
    $responsiveSize: keyof typeof variables.SCREEN_SIZE;
}

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

export const StyledIcon = styled(Icon)<ResponsiveSize>`
    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.$responsiveSize]}) {
        transform: rotate(90deg);
    }
`;

export const FeesWrapper = styled.div`
    margin: 25px 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

export const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

export const FooterWrapper = styled.div`
    display: flex;
    align-items: center;
    padding-top: 30px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

export const StyledSelectBar = styled(SelectBar)`
    width: 100%;

    & div div {
        justify-content: center;
    }
`;

export const CoinmarketParagraph = styled(Paragraph)`
    text-align: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const CoinmarketFormInput = styled.div`
    position: relative;
    padding-bottom: ${spacingsPx.xl};

    input {
        color: ${({ theme }) => theme.textSubdued};
    }
`;

export const CoinmarketFormInputInner = styled.div`
    position: relative;
`;

export const CoinmarketFormInputLabel = styled.label`
    display: block;
    padding-bottom: ${spacingsPx.xs};
    ${typography.body}
`;

export const CoinmarketFormOption = styled.div`
    display: flex;
    align-items: center;
`;

export const CoinmarketFormOptionLabel = styled.div`
    padding-left: ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};
`;

export const CoinmarketFormOptionLabelLong = styled.div`
    padding-left: ${spacingsPx.sm};
    padding-top: ${spacingsPx.xxs};
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;
