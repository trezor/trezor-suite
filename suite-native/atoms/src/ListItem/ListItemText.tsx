import React from 'react';

import { Box } from '../Box';
import { Text } from '../Text';
import { BaseListItem } from './listItemTypes';

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
