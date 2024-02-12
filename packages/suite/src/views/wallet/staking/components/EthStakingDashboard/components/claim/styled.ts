import styled from 'styled-components';
import { variables } from '@trezor/components';

export const FormattedCryptoAmountWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

export const FiatValueWrapper = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.SMALL};
`;
