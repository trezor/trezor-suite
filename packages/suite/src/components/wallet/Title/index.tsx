import * as React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

interface OwnProps {
    children?: React.ReactNode;
}

const Wrapper = styled.div`
    font-size: ${variables.FONT_SIZE.WALLET_TITLE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK};
    padding-bottom: 35px;
`;

const Title = ({ children }: OwnProps) => <Wrapper>{children}</Wrapper>;

export default Title;
