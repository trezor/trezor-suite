import { createContext } from 'react';

import { type Persistor } from 'redux-persist/es/types';

export const StorageContext = createContext<Persistor>({} as Persistor);
