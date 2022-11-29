import { IconName } from '@trezor/icons';
import { AppTabsParamList } from '@suite-native/navigation';

export const typedTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    label,
    params,
}: {
    routeName: RouteName;
    iconName: IconName;
    label?: string;
    params?: ParamList[RouteName];
}) => ({
    [routeName]: {
        routeName,
        iconName,
        label,
        params,
    },
});
