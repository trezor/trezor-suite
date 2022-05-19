import { Text } from '../Text';
import React from 'react';
import { BaseListItem } from './listItemTypes';
import { Box } from '../Box';

type ListItemTextProps = Pick<BaseListItem, 'title' | 'subtitle' | 'isTextTruncated'>;

export const ListItemText = ({ isTextTruncated = false, title, subtitle }: ListItemTextProps) => {
    const numberOfLines = !isTextTruncated ? 0 : 1;

    return (
        <Box flexDirection="column" flex={2}>
            <Text numberOfLines={numberOfLines}>{title}</Text>
            <Text numberOfLines={numberOfLines} variant="hint" color="gray600">
                {subtitle}
            </Text>
        </Box>
    );
};
