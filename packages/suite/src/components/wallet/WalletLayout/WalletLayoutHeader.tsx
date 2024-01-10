import { ReactNode } from 'react';
import styled from 'styled-components';
import { H2, variables } from '@trezor/components';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import { Translation, AccountFormCloseButton } from 'src/components/suite';

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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

type WalletLayoutHeaderProps = {
    children?: ReactNode;
    title: ExtendedMessageDescriptor['id'];
};

export const WalletLayoutHeader = ({ title, children }: WalletLayoutHeaderProps) => (
    <HeaderWrapper>
        <HeaderLeft>
            <StyledTitle>
                <Translation id={title} />
            </StyledTitle>
        </HeaderLeft>
        <HeaderRight>{children}</HeaderRight>
    </HeaderWrapper>
);
