import { EarnProvider } from '@suite-common/suite-types/src/staking';
import { exhaustive } from '@trezor/type-utils';

export const getEarnProviderName = (provider: EarnProvider): string => {
    switch (provider) {
        case EarnProvider.Everstake:
            return 'Everstake';
        case EarnProvider.Morpho:
            return 'Morpho';
        default:
            return exhaustive(provider);
    }
};
