import { Column, IconCircle, List, Paragraph } from '@trezor/components';

import { type TroubleshootingTipsItem } from './TroubleshootingTipsItem';

type TroubleshootingTipsItemProps = {
    item: TroubleshootingTipsItem;
};

export const TroubleshootingTipsItemComponent = ({ item }: TroubleshootingTipsItemProps) => (
    <List.Item
        bulletComponent={
            <IconCircle intent="info" name={item.icon ?? 'dotOutlineFilled'} size={40} />
        }
    >
        <Column>
            <Paragraph typographyStyle="body-md">{item.heading}</Paragraph>
            {item.description && (
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {item.description}
                </Paragraph>
            )}
        </Column>
    </List.Item>
);
