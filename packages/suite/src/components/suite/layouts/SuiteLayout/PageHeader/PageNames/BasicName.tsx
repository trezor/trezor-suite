import styled from 'styled-components';

import { Center, H2, H3 } from '@trezor/components';

import { useIsContentBelowBreakpoint } from '../../../../../../support/suite/ContentFlex';

export const NoDragContainer = styled.div`
    -webkit-app-region: no-drag;
`;

export interface BasicNameProps {
    'data-testid'?: string;
    onClick?: () => void;
    children: React.ReactNode;
}

export const BasicName = ({ 'data-testid': dataTest, children }: BasicNameProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();
    const Heading = isContentBelowBreakpoint ? H3 : H2;

    return (
        <NoDragContainer data-testid={dataTest}>
            <Center>
                <Heading textWrap="nowrap">{children}</Heading>
            </Center>
        </NoDragContainer>
    );
};
