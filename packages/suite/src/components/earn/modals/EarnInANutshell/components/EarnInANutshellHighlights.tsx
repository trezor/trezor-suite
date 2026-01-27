import { ReactNode } from 'react';

import { Icon, IconName, List, Paragraph } from '@trezor/components';

export type EarnInANutshellHighlight = {
    icon: IconName;
    content: ReactNode;
};

interface EarnInANutshellHighlightsProps {
    items: EarnInANutshellHighlight[];
}

export const EarnInANutshellHighlights = ({ items }: EarnInANutshellHighlightsProps) => (
    <List gap={20} bulletGap={16} typographyStyle="hint" margin={{ top: 8 }}>
        {items.map(({ icon, content }, index) => (
            <List.Item key={index} bulletComponent={<Icon name={icon} variant="primary" />}>
                <Paragraph variant="tertiary">{content}</Paragraph>
            </List.Item>
        ))}
    </List>
);
