import styled from 'styled-components';

import { Row } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

const ClickableContainer = styled.button`
    border: unset;
    background: unset;
    box-shadow: unset;

    width: calc(100% - ${spacings.xxs * 2}px);

    cursor: pointer;
    padding: ${spacingsPx.xs} 0;
    margin: ${spacingsPx.xxs} ${spacingsPx.xxs};
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
            <Row
                justifyContent="space-between"
                gap={spacings.sm}
                padding={{ horizontal: spacings.md }}
            >
                {children}
            </Row>
        </ClickableContainer>
    );
}
