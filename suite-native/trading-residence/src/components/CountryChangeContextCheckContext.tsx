import { createContext } from 'react';

import { CountryChangeContextCheck } from '@suite-native/analytics';

export const CountryChangeContextCheckContext =
    createContext<CountryChangeContextCheck>('settings');
