import { useStore as useReduxStore } from 'react-redux';

import { type Store } from 'src/types/suite';

export const useStore: () => Store = useReduxStore;
