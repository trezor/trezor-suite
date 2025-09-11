import { BulletList, List } from '@trezor/components';

import { TroubleshootingTipsItem } from './TroubleshootingTips';
import { TroubleshootingTipsItemComponent } from './TroubleshootingTipsItemComponent';

type TroubleshootingTipsListCardProps = {
    items: TroubleshootingTipsItem[];
};

export const TroubleshootingTipsList = ({ items }: TroubleshootingTipsListCardProps) => {
    const visibleItems = items
        .filter(item => !item.hide)
        .map(item => <TroubleshootingTipsItemComponent item={item} key={item.key} />);
    const isBulletList = items.every(item => item.icon == undefined);

    return isBulletList ? (
        <BulletList bulletSize="medium" titleGap={2} gap={20} bulletGap={16}>
            {visibleItems}
        </BulletList>
    ) : (
        <List gap={20}>{visibleItems}</List>
    );
};
