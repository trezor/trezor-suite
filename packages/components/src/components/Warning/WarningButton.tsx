import { Button, ButtonProps } from '../buttons/Button/Button';
import { useWarningContextContext, WarningContext } from './WarningContext';
import { DEFAULT_VARIANT } from './consts';

export const WarningButton = ({ children, ...rest }: ButtonProps) => {
    const { variant } = useWarningContextContext();
    const value = { variant: DEFAULT_VARIANT };

    return (
        <WarningContext.Provider value={value}>
            <Button {...rest} variant={rest.variant ?? variant} size={rest.size ?? 'small'}>
                {children}
            </Button>
        </WarningContext.Provider>
    );
};
