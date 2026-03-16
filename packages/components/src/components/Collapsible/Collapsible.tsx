import { type ReactNode, useId, useState } from 'react';

import styled from 'styled-components';

import { type SpacingValues, spacings } from '@trezor/theme';

import { CollapsibleContent } from './CollapsibleContent';
import { CollapsibleContext } from './CollapsibleContext';
import { CollapsibleToggle } from './CollapsibleToggle';
import { CollapsibleToggleIcon } from './CollapsibleToggleIcon';

const Container = styled.div``;

export type CollapsibleProps = {
    children: ReactNode;
    isOpen?: boolean;
    defaultIsOpen?: boolean;
    gap?: SpacingValues;
    'data-testid'?: string;
};

export const Collapsible = ({
    children,
    isOpen,
    gap = spacings.zero,
    defaultIsOpen = false,
    'data-testid': dataTest,
}: CollapsibleProps) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultIsOpen);
    const contentId = useId();

    return (
        <CollapsibleContext.Provider
            value={{
                contentId,
                isOpen: isOpen ?? uncontrolledIsOpen,
                toggle: setUncontrolledIsOpen,
                gap,
            }}
        >
            <Container data-testid={dataTest} aria-expanded={isOpen ?? uncontrolledIsOpen}>
                {children}
            </Container>
        </CollapsibleContext.Provider>
    );
};

Collapsible.Content = CollapsibleContent;
Collapsible.Toggle = CollapsibleToggle;
Collapsible.ToggleIcon = CollapsibleToggleIcon;
