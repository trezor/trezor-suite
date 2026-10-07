import type { ChainSendAccount, ChainSendDraft } from '@trezor/network-module-suite-common-types';

import type { Account } from './account';
import type { FormState } from './sendForm';

declare const account: Account;
declare const formState: FormState;

// Chain networks compose and sign for a wallet account and the send form as they are.
const _account: ChainSendAccount = account;
const _draft: ChainSendDraft = formState;

void _account;
void _draft;
