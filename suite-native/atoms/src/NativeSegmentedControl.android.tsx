import {
    Host,
    SegmentedButton,
    SingleChoiceSegmentedButtonRow,
    Text,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, testID as nativeTestID, weight } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { type NativeSegmentedControlProps } from './segmentedControlTypes';

export const supportsNativeSegmentedControl = true;

export const NativeSegmentedControl = <TValue extends string>({
    options,
    selectedValue,
    onValueChange,
    isDisabled = false,
    testID,
}: NativeSegmentedControlProps<TValue>) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const handleChange = (value: TValue) => {
        if (!isDisabled) {
            onValueChange(value);
        }
    };

    return (
        <Host
            matchContents={{ vertical: true }}
            style={{ width: '100%' }}
            colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
            seedColor={colors.contentBrand}
            ignoreSafeAreaKeyboardInsets
        >
            <SingleChoiceSegmentedButtonRow
                modifiers={[fillMaxWidth(), ...(testID ? [nativeTestID(testID)] : [])]}
            >
                {options.map(option => (
                    <SegmentedButton
                        key={option.value}
                        selected={option.value === selectedValue}
                        enabled={!isDisabled}
                        onClick={() => handleChange(option.value)}
                        modifiers={[
                            weight(1),
                            ...(testID ? [nativeTestID(`${testID}/${option.value}`)] : []),
                        ]}
                    >
                        <SegmentedButton.Label>
                            <Text>{option.label}</Text>
                        </SegmentedButton.Label>
                    </SegmentedButton>
                ))}
            </SingleChoiceSegmentedButtonRow>
        </Host>
    );
};
