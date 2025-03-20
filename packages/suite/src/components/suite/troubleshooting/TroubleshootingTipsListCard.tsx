import { Card, List } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TroubleshootingTipsItem } from './TroubleshootingTips';
import { TroubleshootingTipsItemComponent } from './TroubleshootingTipsItemComponent';

type TroubleshootingTipsListCardProps = {
    items: TroubleshootingTipsItem[];
};

export const TroubleshootingTipsListCard = ({ items }: TroubleshootingTipsListCardProps) => (
    <Card>
        <List
            gap={spacings.xl}
            bulletAlignment={items.find(item => item.icon !== undefined) ? 'center' : 'start'}
        >
            {items
                .filter(item => !item.hide)
                .map(item => (
                    <TroubleshootingTipsItemComponent item={item} key={item.key} />
                ))}
        </List>
    </Card>
);
