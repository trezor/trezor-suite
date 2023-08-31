import { Box } from '../Box';
import { Text } from '../Text';
import { BaseListItem } from './listItemTypes';

type ListItemTextProps = Pick<BaseListItem, 'title' | 'subtitle' | 'isTextTruncated'>;

export const ListItemText = ({ isTextTruncated = false, title, subtitle }: ListItemTextProps) => {
    const numberOfLines = !isTextTruncated ? 0 : 1;

    return (
        <Box justifyContent="center" flexDirection="column" flex={2}>
            <Text numberOfLines={numberOfLines}>{title}</Text>
            {subtitle && (
                <Text numberOfLines={numberOfLines} variant="hint" color="textSubdued">
                    {subtitle}
                </Text>
            )}
        </Box>
    );
};
