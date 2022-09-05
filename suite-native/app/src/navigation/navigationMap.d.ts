// Specifying default types for useNavigation, Link, ref etc

import { RootStackParamList } from '@suite-native/module-home';

declare global {
    namespace ReactNavigation {
        type RootParamList = RootStackParamList;
    }
}
