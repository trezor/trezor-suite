import { ReactNode, createContext, useContext, useId, useState } from 'react';

import styled from 'styled-components';

import { CollapsibleContent } from './CollapsibleContent';
import { CollapsibleToggle } from './CollapsibleToggle';
import { CollapsibleToggleIcon } from './CollapsibleToggleIcon';

type CollapsibleContextProps = {
    isOpen: boolean;
    toggle: (isOpen: boolean) => void;
    contentId: string;
};

const CollapsibleContext = createContext<CollapsibleContextProps>({
    isOpen: false,
    toggle: () => {},
    contentId: '',
});

export const useCollapsible = () => useContext(CollapsibleContext);

const Container = styled.div`
    display: contents;
`;

export type CollapsibleProps = {
    children: ReactNode;
    isOpen?: boolean;
    defaultIsOpen?: boolean;
    'data-testid'?: string;
};

export const Collapsible = ({
    children,
    isOpen,
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
            }}
        >
            <Container data-testid={dataTest}>{children}</Container>
        </CollapsibleContext.Provider>
    );
};

Collapsible.Content = CollapsibleContent;
Collapsible.Toggle = CollapsibleToggle;
Collapsible.ToggleIcon = CollapsibleToggleIcon;
