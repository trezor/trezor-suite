import { Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type Props = {
    titleId: TxKeyPath;
    subtitleId: TxKeyPath;
};

export const ActivityCenterEmptyState = ({ titleId, subtitleId }: Props) => (
    <VStack alignItems="center" spacing="sp16">
        <Pictogram variant="info" icon="bellZ" />
        <VStack spacing="sp4" alignItems="center">
            <Text variant="headline-md" textAlign="center">
                <Translation id={titleId} />
            </Text>
            <Text variant="body-md" color="contentSecondary" textAlign="center">
                <Translation id={subtitleId} />
            </Text>
        </VStack>
    </VStack>
);
