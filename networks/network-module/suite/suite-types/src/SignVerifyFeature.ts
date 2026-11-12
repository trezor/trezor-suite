import type { ComponentType } from 'react';

import type { TranslationKey } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';

export type SignVerifyProps = {
    account: Account;
};

/** The whole Sign & Verify form of a network, which Suite renders on its page. */
export type SignVerifyFeature = {
    Component: ComponentType<SignVerifyProps>;
    /** Title of the page; a network that only signs does not offer verification in it. */
    title: TranslationKey;
};
