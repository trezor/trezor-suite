import React, { useContext, useRef, createContext } from 'react';

type ModalContextData = {
    isDisabled: boolean;
    modalTarget: React.RefObject<HTMLDivElement> | null;
};

const ModalContext = createContext<ModalContextData>({
    isDisabled: false,
    modalTarget: null,
});

export const useModalTarget = () => useContext(ModalContext).modalTarget?.current ?? null;

type ModalContextProviderProps = {
    isDisabled?: boolean;
    children: React.ReactNode;
};

export const ModalContextProvider = ({
    isDisabled = false,
    children,
}: ModalContextProviderProps) => {
    const target = useRef<HTMLDivElement>(null);
    const disabled = useContext(ModalContext).isDisabled || isDisabled;
    return (
        <ModalContext.Provider
            value={{
                modalTarget: !disabled ? target : null,
                isDisabled: disabled,
            }}
        >
            <div ref={target} />
            {children}
        </ModalContext.Provider>
    );
};
