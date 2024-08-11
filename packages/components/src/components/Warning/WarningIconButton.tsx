import { IconButton, IconButtonProps } from '../buttons/IconButton/IconButton';
import { useWarningContextContext, WarningContext } from './WarningContext';
import { DEFAULT_VARIANT } from './consts';

export const WarningIconButton = ({ icon, ...rest }: IconButtonProps) => {
    const { variant } = useWarningContextContext();
    const value = { variant: DEFAULT_VARIANT };

    return (
        <WarningContext.Provider value={value}>
            <IconButton
                icon={icon}
                {...rest}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'small'}
            />
        </WarningContext.Provider>
    );
};
