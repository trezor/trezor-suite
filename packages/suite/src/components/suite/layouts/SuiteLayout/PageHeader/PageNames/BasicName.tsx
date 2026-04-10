import styled from 'styled-components';

import { H2 } from '@trezor/components';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

export const NoDragContainer = styled.div`
    -webkit-app-region: no-drag;
`;

export interface BasicNameProps {
    'data-testid'?: string;
    onClick?: () => void;
    children: React.ReactNode;
}

export const BasicName = ({ 'data-testid': dataTest, onClick, children }: BasicNameProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    return (
        <NoDragContainer data-testid={dataTest}>
            <H2
                typographyStyle={isContentBelowBreakpoint ? 'headline-sm' : 'headline-md'}
                textWrap="nowrap"
                onClick={onClick}
            >
                {children}
            </H2>
        </NoDragContainer>
    );
};
