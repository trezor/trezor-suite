import { createContext } from 'react';

import { type CountryChangeContextCheck } from '@suite-native/analytics';

export const CountryChangeContextCheckContext =
    createContext<CountryChangeContextCheck>('settings');
