import React from 'react';
import styled from 'styled-components';
import { H2, variables } from '@trezor/components';
import type { ExtendedMessageDescriptor } from '@suite-types';
import { Translation, AccountFormCloseButton } from '@suite-components';

const HeaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;

    & > * + * {
        margin-left: 5px;
    }
`;

const StyledTitle = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

type WalletLayoutHeaderProps = {
    title: ExtendedMessageDescriptor['id'];
};

export const WalletLayoutHeader: React.FC<WalletLayoutHeaderProps> = ({ title, children }) => (
    <HeaderWrapper>
        <HeaderLeft>
            <StyledTitle>
                <Translation id={title} />
            </StyledTitle>
        </HeaderLeft>
        <HeaderRight>
            {children}
            <AccountFormCloseButton />
        </HeaderRight>
    </HeaderWrapper>
);
