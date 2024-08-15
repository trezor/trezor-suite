import { Button, ButtonProps } from '../buttons/Button/Button';
import { useNewModalContext, NewModalContext } from './NewModalContext';

export const NewModalButton = ({ children, ...rest }: ButtonProps) => {
    const { variant } = useNewModalContext();
    const value = { variant };

    return (
        <NewModalContext.Provider value={value}>
            <Button {...rest} variant={rest.variant ?? variant} size={rest.size ?? 'large'}>
                {children}
            </Button>
        </NewModalContext.Provider>
    );
};
