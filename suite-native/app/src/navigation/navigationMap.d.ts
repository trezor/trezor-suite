// Specifying default types for useNavigation, Link, ref etc
import { AppTabsParamList } from './routes';

declare global {
    namespace ReactNavigation {
        type RootParamList = AppTabsParamList;
    }
}
