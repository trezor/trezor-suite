import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../../Box';
import { HStack, VStack } from '../../Stack';
import { Text } from '../../Text';
import { Card } from '../Card';
import { TimelineDetailsCardItemComponent } from './TimelineDetailsCardItemComponent/TimelineDetailsCardItemComponent';
import { type TimelineDetailsCardProps } from './types';

const headerRowStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    paddingVertical: utils.spacings.sp12,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

export function TimelineDetailsCard({
    headerTitle,
    headerIconName,
    items,
    renderItemIcon,
}: TimelineDetailsCardProps) {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderNeutral" noPadding>
            <VStack spacing={0}>
                <Box paddingHorizontal="sp16">
                    <HStack spacing="sp8" style={applyStyle(headerRowStyle)}>
                        {headerIconName && (
                            <Icon name={headerIconName} color="contentSecondary" size={20} />
                        )}

                        <Text variant="body-md" color="contentSecondary">
                            {headerTitle}
                        </Text>
                    </HStack>
                </Box>

                <Box style={applyStyle(separatorStyle)} />

                <VStack spacing="sp16" padding="sp16">
                    {items.map((item, index) => (
                        <TimelineDetailsCardItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                            renderItemIcon={renderItemIcon}
                        />
                    ))}
                </VStack>
            </VStack>
        </Card>
    );
}
