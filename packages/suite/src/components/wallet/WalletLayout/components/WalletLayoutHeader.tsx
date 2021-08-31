import React from 'react';
import styled from 'styled-components';
import { H2, variables } from '@trezor/components';
import type { ExtendedMessageDescriptor } from '@suite-types';
import { Translation, AccountFormCloseButton } from '@suite-components';

const HeaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 32px;
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
    padding-top: 10px;
`;

type Props = {
    title: ExtendedMessageDescriptor['id'];
};

const WalletLayoutHeader: React.FC<Props> = ({ title, children }) => (
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

export default WalletLayoutHeader;
