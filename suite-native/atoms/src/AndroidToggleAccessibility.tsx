import { type ReactNode } from 'react';
import { View } from 'react-native';

type AndroidToggleAccessibilityProps = {
    children: ReactNode;
    accessibilityLabel?: string;
    testID?: string;
    role: 'checkbox' | 'switch';
    isChecked: boolean;
    isDisabled: boolean;
    onChange: (value: boolean) => void;
};

export const AndroidToggleAccessibility = ({
    children,
    accessibilityLabel,
    testID,
    role,
    isChecked,
    isDisabled,
    onChange,
}: AndroidToggleAccessibilityProps) => {
    if (!accessibilityLabel) {
        return children;
    }

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={role}
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            accessibilityActions={isDisabled ? [] : [{ name: 'activate' }]}
            onAccessibilityAction={({ nativeEvent }) => {
                if (nativeEvent.actionName === 'activate' && !isDisabled) {
                    onChange(!isChecked);
                }
            }}
        >
            <View importantForAccessibility="no-hide-descendants">{children}</View>
        </View>
    );
};
