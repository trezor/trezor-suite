import { IconName } from '@trezor/icons';
import { AppTabsParamList } from '@suite-native/navigation';

export const typedTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    label,
    isActionTabItem,
    params,
}: {
    routeName: RouteName;
    iconName: IconName;
    label?: string;
    isActionTabItem?: boolean;
    params?: ParamList[RouteName];
}) => ({
    [routeName]: {
        routeName,
        iconName,
        label,
        isActionTabItem,
        params,
    },
});
