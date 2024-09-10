import { ReactNode } from 'react';
import { useTheme } from 'styled-components';

import { Column, Icon, IconName, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

type Item = {
    icon: IconName;
    content: ReactNode;
};

type SecurityChecklistProps = {
    items: readonly Item[];
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
