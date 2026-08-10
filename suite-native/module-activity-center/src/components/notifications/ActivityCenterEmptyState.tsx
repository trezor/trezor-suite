import { Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type Props = {
    titleId: TxKeyPath;
    subtitleId: TxKeyPath;
};

export const ActivityCenterEmptyState = ({ titleId, subtitleId }: Props) => (
    <VStack spacing="sp16" alignItems="center">
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
