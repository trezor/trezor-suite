import { IconName } from '@suite-common/icons';
import { AppTabsParamList } from '@suite-native/navigation';

type TabOption<ParamList extends AppTabsParamList, RouteName extends keyof ParamList> = {
    routeName: RouteName;
    iconName: IconName;
    label: string;
    params?: ParamList[RouteName];
};

export const enhanceTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    label,
    params,
}: TabOption<ParamList, RouteName>) => ({
    [routeName]: {
        routeName,
        iconName,
        label,
        params,
    },
});
