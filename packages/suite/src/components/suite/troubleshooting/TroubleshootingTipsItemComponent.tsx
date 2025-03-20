import { Column, Icon, List, Row, Text, iconSizes } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TroubleshootingTipsItem } from './TroubleshootingTips';

type TroubleshootingTipsItemProps = {
    item: TroubleshootingTipsItem;
};

export const TroubleshootingTipsItemComponent = ({ item }: TroubleshootingTipsItemProps) => (
    <List.Item
        bulletComponent={<Icon name={item.icon ?? 'dotOutlineFilled'} size={iconSizes.large} />}
    >
        <Row justifyContent="space-between" alignItems="center">
            <Column gap={spacings.xs}>
                <Text typographyStyle="body">{item.heading}</Text>
                <Text typographyStyle="hint" variant="tertiary">
                    {item.description}
                </Text>
            </Column>
        </Row>
    </List.Item>
);
