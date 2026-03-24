import { List } from '@trezor/components';

import { type TroubleshootingTipsItem } from './TroubleshootingTipsItem';
import { TroubleshootingTipsItemComponent } from './TroubleshootingTipsItemComponent';

type TroubleshootingTipsListCardProps = {
    items: TroubleshootingTipsItem[];
};

export const TroubleshootingTipsList = ({ items }: TroubleshootingTipsListCardProps) => {
    const visibleItems = items
        .filter(item => !item.hide)
        .map(item => <TroubleshootingTipsItemComponent item={item} key={item.key} />);

    return <List gap={20}>{visibleItems}</List>;
};
