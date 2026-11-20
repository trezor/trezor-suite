// Specifying default types for useNavigation, Link, ref etc

import { type RootStackParamList } from '@suite-native/navigation';

declare global {
    namespace ReactNavigation {
        type RootParamList = RootStackParamList;
    }
}
