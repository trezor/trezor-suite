import { type IconName } from '@suite-native/icons';
import { type AppTabsParamList } from '@suite-native/navigation';

type TabOption<ParamList extends AppTabsParamList, RouteName extends keyof ParamList> = {
    routeName: RouteName;
    iconName: IconName;
    focusedIconName: IconName;
    params?: ParamList[RouteName];
};

type EnhancedTabOption<
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
> = Record<string, TabOption<ParamList, RouteName>>;

export const enhanceTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    focusedIconName,
    params,
}: TabOption<ParamList, RouteName>): EnhancedTabOption<ParamList, RouteName> => ({
    [routeName]: {
        routeName,
        iconName,
        focusedIconName,
        params,
    },
});
