import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type CardContentRowProps = {
    labelId: TxKeyPath;
    descriptionId: TxKeyPath;
    iconName: IconName;
};

export const CardContentRow = ({ labelId, descriptionId, iconName }: CardContentRowProps) => (
    <HStack spacing="sp12">
        <Icon name={iconName} size="mediumLarge" />
        <VStack spacing="sp4" flex={1}>
            <Text variant="body-sm-strong">
                <Translation id={labelId} />
            </Text>
            <Text variant="body-sm" color="textSubdued">
                <Translation
                    id={descriptionId}
                    values={{
                        bold: chunks => (
                            <Text color="textSubdued" variant="body-sm-strong">
                                {chunks}
                            </Text>
                        ),
                    }}
                />
            </Text>
        </VStack>
    </HStack>
);
