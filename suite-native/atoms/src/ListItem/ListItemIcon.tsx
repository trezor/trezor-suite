import { IconName } from '@suite-common/icons';

import { Box } from '../Box';
import { RoundedIcon } from '../RoundedIcon';

type ListItemIconProps = {
    iconName: IconName;
};

export const ListItemIcon = ({ iconName }: ListItemIconProps) => (
    <Box justifyContent="center" alignItems="center" marginRight="medium">
        <RoundedIcon name={iconName} color="iconSubdued" iconSize="mediumLarge" />
    </Box>
);
