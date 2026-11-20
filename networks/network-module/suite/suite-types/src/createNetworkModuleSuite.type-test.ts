import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import type { SignVerify } from './SignVerify';
import { createNetworkModuleSuite } from './createNetworkModuleSuite';

const supportedNetworks = ['aaa', 'taaa'] as const;
declare const common: SuiteCommonNetworkModule;
declare const signVerify: SignVerify<'aaa' | 'taaa'>;
declare const foreignSignVerify: SignVerify<'zzz'>;

const networkModule = createNetworkModuleSuite(common, supportedNetworks, { signVerify });
const foreignModule = createNetworkModuleSuite(common, supportedNetworks, {
    // @ts-expect-error A component for a different network cannot serve this module.
    signVerify: foreignSignVerify,
});

void networkModule;
void foreignModule;
