import { ModalContext, useModalContext } from './ModalContext';
import { Button, ButtonProps } from '../buttons/Button/Button';

export const ModalButton = ({
    children,
    intent,
    size = 'large',
    minWidth = 150,
    ...rest
}: ButtonProps) => {
    const { intent: modalIntent } = useModalContext();
    const resolvedIntent = intent ?? modalIntent ?? 'brand';

    return (
        <ModalContext.Provider value={{ intent: modalIntent }}>
            <Button intent={resolvedIntent} size={size} minWidth={minWidth} {...rest}>
                {children}
            </Button>
        </ModalContext.Provider>
    );
};
