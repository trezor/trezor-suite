import { selectCustomBackends } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

export const useCustomBackends = () => useSelector(selectCustomBackends);
