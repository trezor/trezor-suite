import { Box, Pictogram } from '@suite-native/atoms';

import { type Alert } from '../alertsAtoms';

type AlertSheetIconProps = Pick<Alert, 'customIcon' | 'pictogramVariant' | 'icon'>;

export const AlertSheetIcon = ({ customIcon, pictogramVariant, icon }: AlertSheetIconProps) => {
    if (customIcon) {
        return <Box alignItems="center">{customIcon}</Box>;
    }

    if (pictogramVariant) {
        return (
            <Box alignItems="center">
                <Pictogram variant={pictogramVariant} icon={icon} />
            </Box>
        );
    }

    return null;
};
