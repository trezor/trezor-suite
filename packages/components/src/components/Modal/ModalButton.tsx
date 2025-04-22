import { ModalContext, useModalContext } from './ModalContext';
import { Button, ButtonProps } from '../buttons/Button/Button';

export const ModalButton = ({ children, ...rest }: ButtonProps) => {
    const { variant } = useModalContext();
    const value = { variant };

    return (
        <ModalContext.Provider value={value}>
            <Button
                {...rest}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'large'}
                minWidth={150}
            >
                {children}
            </Button>
        </ModalContext.Provider>
    );
};
