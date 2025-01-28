import { NewModalContext, useNewModalContext } from './NewModalContext';
import { Button, ButtonProps } from '../buttons/Button/Button';

export const NewModalButton = ({ children, ...rest }: ButtonProps) => {
    const { variant } = useNewModalContext();
    const value = { variant };

    return (
        <NewModalContext.Provider value={value}>
            <Button
                {...rest}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'large'}
                minWidth={150}
            >
                {children}
            </Button>
        </NewModalContext.Provider>
    );
};
