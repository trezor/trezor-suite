import { type IconName } from '@suite-native/icons';
import { type AppTabsParamList } from '@suite-native/navigation';

type TabOption<ParamList extends AppTabsParamList, RouteName extends keyof ParamList> = {
    routeName: RouteName;
    iconName: IconName;
    focusedIconName: IconName;
    label: string;
    params?: ParamList[RouteName];
};

export const enhanceTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    focusedIconName,
    params,
}: Omit<TabOption<ParamList, RouteName>, 'label'>) => ({
    [routeName]: {
        routeName,
        iconName,
        focusedIconName,
        params,
    },
});
