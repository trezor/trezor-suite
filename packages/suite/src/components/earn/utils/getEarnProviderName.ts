import { type EarnProvider, getEarnProviderId } from '@suite-common/suite-types';
import { getEarnProvider } from '@suite-common/wallet-config';

export const getEarnProviderName = (provider: EarnProvider): string =>
    getEarnProvider(getEarnProviderId(provider)).name;
