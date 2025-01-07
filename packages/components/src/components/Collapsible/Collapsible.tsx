import { ReactNode, createContext, useContext, useState, useId } from 'react';

import styled from 'styled-components';

import { CollapsibleContent } from './CollapsibleContent';
import { CollapsibleToggle } from './CollapsibleToggle';

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
};

export const Collapsible = ({ children, isOpen, defaultIsOpen = false }: CollapsibleProps) => {
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
            <Container>{children}</Container>
        </CollapsibleContext.Provider>
    );
};

Collapsible.Content = CollapsibleContent;
Collapsible.Toggle = CollapsibleToggle;
