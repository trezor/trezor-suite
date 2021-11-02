import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { H3 } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Title = styled(H3)`
    display: flex;
    align-items: center;
`;

const Actions = styled.div``;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    heading: ReactElement;
    actions?: ReactElement;
}

const Section = React.forwardRef(
    ({ heading, actions, children, ...rest }: Props, ref: React.Ref<HTMLDivElement>) => (
        <Wrapper {...rest} ref={ref}>
            <Header>
                {heading && <Title>{heading}</Title>}
                {actions && <Actions>{actions}</Actions>}
            </Header>
            {children}
        </Wrapper>
    ),
);

export default Section;
