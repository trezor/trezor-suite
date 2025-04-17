import { Pressable } from 'react-native';

import { Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradingProviderLogo } from '../TradingProviderLogo';

export type ProviderListItemProps = {
    orderId: string;
    companyName: string;
    logo: string;
    isSelected: boolean;
    onPress: () => void;
};

export const PROVIDER_LIST_ITEM_HEIGHT = 66 as const;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const ProviderListItem = ({
    orderId,
    companyName,
    logo,
    isSelected,
    onPress,
}: ProviderListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
            <Card>
                <HStack alignItems="center" justifyContent="space-between">
                    <HStack>
                        <TradingProviderLogo logo={logo} />
                        <Text variant="body" color="textDefault">
                            {companyName}
                        </Text>
                    </HStack>
                    <Radio value={orderId} onPress={onPress} isChecked={isSelected} />
                </HStack>
            </Card>
        </Pressable>
    );
};
