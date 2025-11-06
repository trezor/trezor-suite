import styled from 'styled-components';

import { Row } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

const ClickableContainer = styled.button`
    border: unset;
    background: unset;
    box-shadow: unset;

    width: 100%;

    cursor: pointer;
    padding: ${spacingsPx.sm} 0;
    border-radius: 4px;
    transition: background-color 150ms ease-in-out;

    &:hover {
        background-color: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

interface ItemClickableContainerProps {
    children: React.ReactNode;
    onClick: () => void;
}

export function ItemClickableContainer({ children, onClick }: ItemClickableContainerProps) {
    return (
        <ClickableContainer
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
        >
            <Row justifyContent="space-between" gap={spacings.sm}>
                {children}
            </Row>
        </ClickableContainer>
    );
}
