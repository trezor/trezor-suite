import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

type CommandPaletteContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
    isOpen: false,
    open: () => {},
    close: () => {},
    toggle: () => {},
});

type CommandPaletteProviderProps = {
    children: ReactNode;
};

export const CommandPaletteProvider = ({ children }: CommandPaletteProviderProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

    return (
        <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
    );
};

export const useCommandPalette = () => useContext(CommandPaletteContext);
