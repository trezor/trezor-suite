import {
    CompactCardWithIconLayout,
    type CompactCardWithIconLayoutProps,
} from '@suite-native/atoms';

export const AppSettingsCardWithIconLayout = ({
    icon,
    iconIntent,
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
        iconIntent={iconIntent}
        title={title}
        noShadow={noShadow}
        onPress={onPress}
        testID={testID}
        subtitle={subtitle}
        borderColor={borderColor}
        variant={variant}
    />
);
