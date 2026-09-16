import { asNetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import { PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

type TronFeeInfoButtonProps = {
    isAccountActivation: boolean;
};

export const TronFeeInfoButton = ({ isAccountActivation }: TronFeeInfoButtonProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const handlePress = () => {
        showAlert({
            description: (
                <Text color="contentPrimary">
                    {isAccountActivation ? (
                        <Translation
                            id="transactionManagement.fees.description.bodyTronAccountActivation"
                            values={{
                                networkDisplaySymbol: getNetworkDisplaySymbol(
                                    asNetworkSymbol('trx'),
                                ),
                            }}
                        />
                    ) : (
                        <Translation id="transactionManagement.fees.description.bodyTron" />
                    )}
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
