import { useTheme } from 'styled-components';

import { Column, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SecurityChecklistItem } from './types';

type SecurityChecklistProps = {
    items: readonly SecurityChecklistItem[];
};

export const SecurityChecklist = ({ items }: SecurityChecklistProps) => {
    const theme = useTheme();

    return (
        <Column
            alignItems="flex-start"
            gap={spacings.xl}
            margin={{ top: spacings.xl, bottom: spacings.xxxxl }}
        >
            {items.map(item => (
                <Row key={item.icon} gap={spacings.xl}>
                    <Icon size={24} name={item.icon} color={theme.legacy.TYPE_DARK_GREY} />
                    <Text variant="tertiary">{item.content}</Text>
                </Row>
            ))}
        </Column>
    );
};
