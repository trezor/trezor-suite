import styled from 'styled-components';
import { Icon, variables, SelectBar } from '@trezor/components';
import { CardWithHeader } from 'src/components/suite/CardWithHeader';

interface ResponsiveSize {
    responsiveSize: keyof typeof variables.SCREEN_SIZE;
}

export const Wrapper = styled.div<ResponsiveSize>`
    display: flex;
    flex: 1;

    @media screen and (min-width: ${props => variables.SCREEN_SIZE[props.responsiveSize]}) {
        flex-flow: wrap;
    }

    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.responsiveSize]}) {
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

    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.responsiveSize]}) {
        padding-bottom: 27px;
    }
`;

export const StyledIcon = styled(Icon)<ResponsiveSize>`
    @media screen and (max-width: ${props => variables.SCREEN_SIZE[props.responsiveSize]}) {
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

export const SavingsKYCCard = styled(CardWithHeader)`
    border-radius: 6px;
    display: flex;
    margin-bottom: 12px;
    align-items: center;
    height: 104px;
    width: 100%;
`;
