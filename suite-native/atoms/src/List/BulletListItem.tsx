import { type ReactNode, useContext } from 'react';

import { Box } from '../Box';
import { Text } from '../Text';
import { BulletListContext } from './BulletList';

const INDENTED_BULLET_POINT_SYMBOL = ' \u2022 ';

type BulletListItemProps = {
    children: ReactNode;
};

export const BulletListItem = ({ children }: BulletListItemProps) => {
    const { textVariant, textColor } = useContext(BulletListContext);

    return (
        <Box flexDirection="row">
            <Text variant={textVariant} color={textColor}>
                {INDENTED_BULLET_POINT_SYMBOL}
            </Text>
            <Box flexShrink={1}>
                <Text variant={textVariant} color={textColor}>
                    {children}
                </Text>
            </Box>
        </Box>
    );
};
