import { NetworkSymbol } from '@suite-common/wallet-config';
import { XpubAddress } from '@suite-common/wallet-types';

export enum AssetsStackRoutes {
    Onboarding = 'Onboarding',
    XpubScan = 'XpubScan',
    AssetsImport = 'AssetsImport',
}

export type AssetsStackParamList = {
    [AssetsStackRoutes.Onboarding]: undefined;
    [AssetsStackRoutes.XpubScan]: undefined;
    [AssetsStackRoutes.AssetsImport]: {
        xpubAddress: XpubAddress;
        currencySymbol: NetworkSymbol;
    };
};
