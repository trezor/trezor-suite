// Specifying default types for useNavigation, Link, ref etc
import { RootTabsParamList } from './routes';

declare global {
    namespace ReactNavigation {
        type RootParamList = RootTabsParamList;
    }
}
