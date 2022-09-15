import { createContext } from 'react';

import { Persistor } from 'redux-persist/es/types';

export const StorageContext = createContext<Persistor>({} as Persistor);
