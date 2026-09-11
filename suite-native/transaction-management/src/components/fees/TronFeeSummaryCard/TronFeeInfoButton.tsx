import { type GestureResponderEvent } from 'react-native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import { PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

export const TronFeeInfoButton = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const handlePress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        showAlert({
            description: (
                <Text color="contentPrimary">
                    <Translation
                        id="transactionManagement.fees.description.bodyTronAccountActivation"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol('trx') }}
                    />
                </Text>
            ),
            textAlign: 'left',

            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            testID: '@transactionManagement/tron-fee-info-alert',
        });
    };

    return (
        <PressableOpacity
            accessibilityRole="button"
            accessibilityLabel={translate(
                'transactionManagement.fees.description.infoAccessibilityLabel',
            )}
            hitSlop={12}
            onPress={handlePress}
            testID="@transactionManagement/tron-fee-info-button"
        >
            <Icon name="info" size="medium" color="contentSecondary" />
        </PressableOpacity>
    );
};
