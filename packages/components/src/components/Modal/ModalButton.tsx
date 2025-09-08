import { ModalContext, useModalContext } from './ModalContext';
import { Button, ButtonProps } from '../buttons/Button/Button';

export const ModalButton = ({ children, 'data-testid': dataTestId, ...rest }: ButtonProps) => {
    const { variant } = useModalContext();
    const value = { variant };

    return (
        <ModalContext.Provider value={value}>
            <Button
                {...rest}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'large'}
                minWidth={150}
                data-testid={dataTestId}
            >
                {children}
            </Button>
        </ModalContext.Provider>
    );
};
