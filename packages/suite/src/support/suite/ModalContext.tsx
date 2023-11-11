import {
    useContext,
    useRef,
    createContext,
    RefObject,
    ReactNode,
    useEffect,
    useState,
} from 'react';

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
    const disabled = useContext(ModalContext).isDisabled || isDisabled;
    const [modalTarget, setModalTarget] = useState<RefObject<HTMLDivElement> | null>(null);

    const target = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setModalTarget(target);
    }, [target]);

    return (
        <ModalContext.Provider
            value={{
                modalTarget: !disabled ? modalTarget : null,
                isDisabled: disabled,
            }}
        >
            <div ref={target} />
            {children}
        </ModalContext.Provider>
    );
};
