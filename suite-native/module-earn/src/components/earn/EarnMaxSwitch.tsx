import { HStack, Switch, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

type EarnMaxSwitchProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    testID?: string;
};

export const EarnMaxSwitch = ({ isChecked, onChange, testID }: EarnMaxSwitchProps) => {
    const { translate } = useTranslate();

    return (
        <HStack alignItems="center" spacing="sp8">
            <Text variant="body-sm">
                <Translation id="earn.max" />
            </Text>
            <Switch
                accessibilityLabel={translate('earn.max')}
                isChecked={isChecked}
                onChange={onChange}
                testID={testID}
            />
        </HStack>
    );
};
