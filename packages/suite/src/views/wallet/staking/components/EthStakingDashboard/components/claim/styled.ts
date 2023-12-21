import styled from 'styled-components';
import { variables } from '@trezor/components';

export const FormattedCryptoAmountWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const FiatValueWrapper = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;
