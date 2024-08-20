import { Button, ButtonProps } from '../buttons/Button/Button';
import { useWarningContextContext, WarningContext } from './WarningContext';
import { DEFAULT_VARIANT } from './consts';

export const WarningButton = ({ children, ...rest }: ButtonProps) => {
    const { variant, isSubtle } = useWarningContextContext();
    const value = { variant: DEFAULT_VARIANT, isSubtle: true };

    return (
        <WarningContext.Provider value={value}>
            <Button
                {...rest}
                variant={rest.variant ?? variant}
                isSubtle={isSubtle}
                size={rest.size ?? 'small'}
            >
                {children}
            </Button>
        </WarningContext.Provider>
    );
};
