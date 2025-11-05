import { ModalContext, useModalContext } from './ModalContext';
import { ModalVariant } from './types';
import { Button, ButtonProps } from '../buttons/Button/Button';

const mapVariantToIntent = (
    variant: ModalVariant | undefined,
): NonNullable<ButtonProps['intent']> => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'critical';
        default:
            return 'brand';
    }
};

export const ModalButton = ({
    children,
    intent,
    size = 'large',
    minWidth = 150,
    ...rest
}: ButtonProps) => {
    const { variant: modalVariant } = useModalContext();
    const resolvedIntent = intent ?? mapVariantToIntent(modalVariant);

    return (
        <ModalContext.Provider value={{ variant: modalVariant }}>
            <Button intent={resolvedIntent} size={size} minWidth={minWidth} {...rest}>
                {children}
            </Button>
        </ModalContext.Provider>
    );
};
