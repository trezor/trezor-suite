import { List, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { type SecurityChecklistItem } from './types';

type SecurityChecklistProps = {
    items: readonly SecurityChecklistItem[];
};

export const SecurityChecklist = ({ items }: SecurityChecklistProps) => (
    <List gap={spacings.xl}>
        {items.map((item, index) => (
            <List.Item bulletComponent={item.icon} key={index}>
                <Paragraph intent="neutral" priority="secondary">
                    {item.content}
                </Paragraph>
                {item.subtitle ? (
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {item.subtitle}
                    </Paragraph>
                ) : null}
            </List.Item>
        ))}
    </List>
);
