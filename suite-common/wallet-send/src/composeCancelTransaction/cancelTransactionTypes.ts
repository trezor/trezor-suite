import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

export type ConnectComposeTxCallParams = Parameters<typeof TrezorConnect.composeTransaction>[0];

export type ComposeCancelTransactionPartialAccount = Pick<Account, 'symbol'> &
    ConnectComposeTxCallParams['account'];
