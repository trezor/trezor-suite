import { ModalContext, useModalContext } from './ModalContext';
import { ModalVariant } from './types';
import { NewButton, NewButtonProps } from '../buttons/NewButton/NewButton';

const mapVariantToIntent = (
    variant: ModalVariant | undefined,
): NonNullable<NewButtonProps['intent']> => {
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
}: NewButtonProps) => {
    const { variant: modalVariant } = useModalContext();
    const resolvedIntent = intent ?? mapVariantToIntent(modalVariant);

    return (
        <ModalContext.Provider value={{ variant: modalVariant }}>
            <NewButton intent={resolvedIntent} size={size} minWidth={minWidth} {...rest}>
                {children}
            </NewButton>
        </ModalContext.Provider>
    );
};
