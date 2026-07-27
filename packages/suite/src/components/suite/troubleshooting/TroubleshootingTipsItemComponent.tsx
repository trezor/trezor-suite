import { Column, IconCircle, List, Paragraph } from '@trezor/components';
import { DotOutlineFilledIcon } from '@trezor/icons';

import { type TroubleshootingTipsItem } from './TroubleshootingTipsItem';

type TroubleshootingTipsItemProps = {
    item: TroubleshootingTipsItem;
};

export const TroubleshootingTipsItemComponent = ({ item }: TroubleshootingTipsItemProps) => (
    <List.Item
        bulletComponent={
            <IconCircle intent="info" icon={item.icon ?? DotOutlineFilledIcon} size={40} />
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
