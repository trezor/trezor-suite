import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';

type CardContentRowProps = {
    labelId: TxKeyPath;
    descriptionId: TxKeyPath;
    iconName: IconName;
};

export const CardContentRow = ({ labelId, descriptionId, iconName }: CardContentRowProps) => (
    <HStack spacing="sp12">
        <Icon name={iconName} size="mediumLarge" />
        <VStack spacing="sp4" flex={1}>
            <Text variant="callout">
                <Translation id={labelId} />
            </Text>
            <Text variant="hint" color="textSubdued">
                <Translation
                    id={descriptionId}
                    values={{
                        bold: chunks => (
                            <Text color="textSubdued" variant="callout">
                                {chunks}
                            </Text>
                        ),
                    }}
                />
            </Text>
        </VStack>
    </HStack>
);
