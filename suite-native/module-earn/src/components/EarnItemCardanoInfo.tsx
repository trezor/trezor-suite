import { Divider, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { EarnItem } from '../types';

type EarnItemCardanoInfoProps = EarnItem;
export const EarnItemCardanoInfo = ({ symbol }: EarnItemCardanoInfoProps) => {
    if (symbol !== 'ada') return null;

    return (
        <>
            <Divider />
            <HStack paddingHorizontal="sp16">
                <Icon size="mediumLarge" name="info" color="textSubdued" />
                <Text style={{ flexShrink: 1 }} variant="hint" color="textSubdued">
                    <Translation id="earn.earnScreen.adaInfo" />
                </Text>
            </HStack>
        </>
    );
};
