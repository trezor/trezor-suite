import { useContext } from 'react';

import { Persistor } from 'redux-persist/es/types';

import { StorageContext } from './contexts';

export const useStoragePersistor = (): Persistor => useContext(StorageContext);
