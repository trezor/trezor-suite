import { ReactNode } from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import { Translation } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';

const HeaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.lg};
`;

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${spacingsPx.xxs};
    flex: 1;
`;

type WalletSubpageHeadingProps = {
    title: ExtendedMessageDescriptor['id'];
    children?: ReactNode;
};

export const WalletSubpageHeading = ({ title, children }: WalletSubpageHeadingProps) => (
    <HeaderWrapper>
        <H2>
            <Translation id={title} />
        </H2>

        <HeaderActions>{children}</HeaderActions>
    </HeaderWrapper>
);
