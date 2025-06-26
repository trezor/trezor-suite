import { CompactCardWithIconLayout, CompactCardWithIconLayoutProps } from '@suite-native/atoms';

export const AppSettingsCardWithIconLayout = ({
    icon,
    title,
    onPress,
    testID,
    subtitle,
    noShadow,
    borderColor,
}: CompactCardWithIconLayoutProps) => (
    <CompactCardWithIconLayout
        icon={icon}
        title={title}
        noShadow={noShadow}
        paddingVertical="sp12"
        onPress={onPress}
        testID={testID}
        subtitle={subtitle}
        borderColor={borderColor}
    />
);
