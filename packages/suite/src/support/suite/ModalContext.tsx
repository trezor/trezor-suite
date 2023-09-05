import { useContext, useRef, createContext, RefObject, ReactNode } from 'react';

type ModalContextData = {
    isDisabled: boolean;
    modalTarget: RefObject<HTMLDivElement> | null;
};

const ModalContext = createContext<ModalContextData>({
    isDisabled: false,
    modalTarget: null,
});

export const useModalTarget = () => useContext(ModalContext).modalTarget?.current ?? null;

type ModalContextProviderProps = {
    isDisabled?: boolean;
    children: ReactNode;
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
