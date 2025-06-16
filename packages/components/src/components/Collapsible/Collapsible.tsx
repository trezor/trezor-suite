import { ReactNode, createContext, useContext, useId, useState } from 'react';

import styled from 'styled-components';

import { SpacingValues, spacings } from '@trezor/theme';

import { CollapsibleContent } from './CollapsibleContent';
import { CollapsibleToggle } from './CollapsibleToggle';
import { CollapsibleToggleIcon } from './CollapsibleToggleIcon';

type CollapsibleContextProps = {
    isOpen: boolean;
    toggle: (isOpen: boolean) => void;
    gap?: SpacingValues;
    contentId: string;
};

const CollapsibleContext = createContext<CollapsibleContextProps>({
    isOpen: false,
    toggle: () => {},
    gap: spacings.zero,
    contentId: '',
});

export const useCollapsible = () => useContext(CollapsibleContext);

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
            <Container data-testid={dataTest}>{children}</Container>
        </CollapsibleContext.Provider>
    );
};

Collapsible.Content = CollapsibleContent;
Collapsible.Toggle = CollapsibleToggle;
Collapsible.ToggleIcon = CollapsibleToggleIcon;
