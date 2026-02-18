import { List } from '@trezor/components';

import { TroubleshootingTipsItemComponent } from './TroubleshootingTipsItemComponent';
import type { TroubleshootingTipsItem } from './types';

type TroubleshootingTipsListCardProps = {
    items: TroubleshootingTipsItem[];
};

export const TroubleshootingTipsList = ({ items }: TroubleshootingTipsListCardProps) => {
    const visibleItems = items
        .filter(item => !item.hide)
        .map(item => <TroubleshootingTipsItemComponent item={item} key={item.key} />);

    return <List gap={20}>{visibleItems}</List>;
};
