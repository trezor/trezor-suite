import { BulletList, Column, IconCircle, List, Paragraph, Text } from '@trezor/components';

import { TroubleshootingTipsItem } from './TroubleshootingTips';

type TroubleshootingTipsItemProps = {
    item: TroubleshootingTipsItem;
};

export const TroubleshootingTipsItemComponent = ({ item }: TroubleshootingTipsItemProps) => {
    const isBulletList = item.icon == undefined;

    return isBulletList ? (
        <BulletList.Item title={item.heading}>
            <Text variant="tertiary">{item.description}</Text>
        </BulletList.Item>
    ) : (
        <List.Item
            bulletComponent={
                <IconCircle
                    variant="info"
                    hasBorder={false}
                    paddingType="medium"
                    name={item.icon ?? 'dotOutlineFilled'}
                    size={40}
                />
            }
        >
            <Column gap={2}>
                <Paragraph typographyStyle="body">{item.heading}</Paragraph>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    {item.description}
                </Paragraph>
            </Column>
        </List.Item>
    );
};
