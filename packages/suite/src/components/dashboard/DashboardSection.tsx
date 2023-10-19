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

interface DashboardSectionProps extends HTMLAttributes<HTMLDivElement> {
    heading: ReactElement;
    actions?: ReactElement;
}

export const DashboardSection = forwardRef(
    ({ heading, actions, children, ...rest }: DashboardSectionProps, ref: Ref<HTMLDivElement>) => (
        <Wrapper {...rest} ref={ref}>
            <Header>
                {heading && <Title>{heading}</Title>}
                {actions && <div>{actions}</div>}
            </Header>
            {children}
        </Wrapper>
    ),
);
