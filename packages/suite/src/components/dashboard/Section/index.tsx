import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.H2};
`;

const Actions = styled.div``;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    heading: ReactElement;
    actions?: ReactElement;
}

export default ({ heading, actions, children, ...rest }: Props) => (
    <Wrapper {...rest}>
        <Header>
            {heading && <Title>{heading}</Title>}
            {actions && <Actions>{actions}</Actions>}
        </Header>
        {children}
    </Wrapper>
);
