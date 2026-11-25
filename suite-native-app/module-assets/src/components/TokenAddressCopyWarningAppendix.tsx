import { useAtom } from 'jotai';

import { CheckBox, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { isTokenCopyWarningOptOutCheckedAtom } from '../tokenAddressCopyWarningAtoms';

export const TokenAddressCopyWarningAppendix = () => {
    const [isChecked, setIsChecked] = useAtom(isTokenCopyWarningOptOutCheckedAtom);

    const toggleIsChecked = () => setIsChecked(!isChecked);

    return (
        <PressableOpacity onPress={toggleIsChecked}>
            <HStack spacing="sp12" alignItems="center">
                <CheckBox
                    isChecked={isChecked}
                    onChange={toggleIsChecked}
                    testID="@asset-detail/settings/copy-address-warning-alert/do-not-show-again"
                />
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.doNotShowAgain" />
                </Text>
            </HStack>
        </PressableOpacity>
    );
};
