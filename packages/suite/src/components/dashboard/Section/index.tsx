import { Ref, forwardRef, ReactElement, HTMLAttributes } from 'react';
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

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
    heading: ReactElement;
    actions?: ReactElement;
}

const Section = forwardRef(
    ({ heading, actions, children, ...rest }: SectionProps, ref: Ref<HTMLDivElement>) => (
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
