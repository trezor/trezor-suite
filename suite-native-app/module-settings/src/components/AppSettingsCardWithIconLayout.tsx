import {
    CompactCardWithIconLayout,
    type CompactCardWithIconLayoutProps,
} from '@suite-native/atoms';

export const AppSettingsCardWithIconLayout = ({
    icon,
    title,
    onPress,
    testID,
    subtitle,
    noShadow,
    borderColor,
    variant,
}: CompactCardWithIconLayoutProps) => (
    <CompactCardWithIconLayout
        icon={icon}
        title={title}
        noShadow={noShadow}
        onPress={onPress}
        testID={testID}
        subtitle={subtitle}
        borderColor={borderColor}
        variant={variant}
    />
);
