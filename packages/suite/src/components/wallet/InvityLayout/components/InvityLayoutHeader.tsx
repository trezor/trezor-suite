import React, { PropsWithChildren, useCallback } from 'react';
import styled from 'styled-components';
import { H2, variables } from '@trezor/components';
import type { ExtendedMessageDescriptor, AppState } from '@suite-types';
import { Translation, CloseButton } from '@suite-components';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';

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

interface InvityLayoutHeaderProps {
    title: ExtendedMessageDescriptor['id'];
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const InvityLayoutHeader: React.FC<InvityLayoutHeaderProps> = ({
    title,
    children,
    selectedAccount,
}: PropsWithChildren<InvityLayoutHeaderProps>) => {
    const { navigateToBuyForm } = useCoinmarketNavigation(selectedAccount.account);
    const handleCloseButtonClick = useCallback(() => {
        navigateToBuyForm();
    }, [navigateToBuyForm]);
    return (
        <HeaderWrapper>
            <HeaderLeft>
                <StyledTitle>
                    <Translation id={title} />
                </StyledTitle>
            </HeaderLeft>
            <HeaderRight>
                {children}
                <CloseButton onClick={() => handleCloseButtonClick()} />
            </HeaderRight>
        </HeaderWrapper>
    );
};

export default InvityLayoutHeader;
