import { ListItem, ListItemProps } from '@suite-native/atoms';

export const SettingsSectionItem = ({ title, subtitle, iconName, onPress }: ListItemProps) => (
    <ListItem
        onPress={onPress}
        subtitle={subtitle}
        title={title}
        iconName={iconName}
        hasRightArrow
    />
);
