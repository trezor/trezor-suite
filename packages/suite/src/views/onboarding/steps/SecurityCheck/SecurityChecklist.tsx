import { List, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SecurityChecklistItem } from './types';

type SecurityChecklistProps = {
    items: readonly SecurityChecklistItem[];
};

export const SecurityChecklist = ({ items }: SecurityChecklistProps) => (
    <List gap={spacings.xl}>
        {items.map((item, index) => (
            <List.Item bulletComponent={item.icon} key={index}>
                <Paragraph variant="tertiary">{item.content}</Paragraph>
                {item.subtitle ? (
                    <Paragraph typographyStyle="hint" variant="tertiary">
                        {item.subtitle}
                    </Paragraph>
                ) : null}
            </List.Item>
        ))}
    </List>
);
