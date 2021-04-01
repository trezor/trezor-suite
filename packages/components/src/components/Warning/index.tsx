import React from 'react';
import { Icon } from '../Icon';
import styled from 'styled-components';

const Wrapper = styled.div`
    border-radius: 4px;
    padding: 0 12px 0 13px;
    background: ${props => props.theme.BG_GREY};
    display: flex;
`;

const IconWrapper = styled.div`
    margin-right: 15px;
    padding: 8px 0;
`;

const ChildrenWrapper = styled.div`
    padding: 7px 0 3px;
`;

const Warning = ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
    <Wrapper>
        <IconWrapper>
            <Icon size={16} icon="WARNING_ACTIVE" />
        </IconWrapper>
        <ChildrenWrapper>{children}</ChildrenWrapper>
    </Wrapper>
);

export { Warning };
