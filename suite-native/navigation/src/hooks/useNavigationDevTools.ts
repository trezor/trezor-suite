import { type NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';

/*
Wires expo-router's navigation container ref into the Rozenite React Navigation DevTools plugin.
Thin shim so consumers don't need to depend on @rozenite/react-navigation-plugin directly.
 */
export const useNavigationDevTools = ({
    ref,
}: {
    ref: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
}) => {
    useReactNavigationDevTools({ ref });
};
