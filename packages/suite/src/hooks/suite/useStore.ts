import { useStore as useReduxStore } from 'react-redux';

import { Store } from 'src/types/suite';

export const useStore: () => Store = useReduxStore;
