import { Card, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

export const NoProvidersPlaceholder = () => {
    const { translate } = useTranslate();

    return (
        <Card>
            <HStack spacing="sp8" alignItems="center">
                <Icon
                    name="prohibit"
                    color="textSubdued"
                    accessibilityLabel={translate('moduleTrading.providerSheet.noProviders')}
                    size="large"
                />
                <Text variant="body-sm" color="textSubdued">
                    <Translation id="moduleTrading.providerSheet.noProviders" />
                </Text>
            </HStack>
        </Card>
    );
};
