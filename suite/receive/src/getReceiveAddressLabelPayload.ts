import { isAccountBasedNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

export const getReceiveAddressLabelPayload = (account: Account, address: string) =>
    isAccountBasedNetwork(account.symbol)
        ? ({
              type: 'accountLabel',
              entityKey: account.key,
              defaultValue: account.path,
          } as const)
        : ({
              type: 'addressLabel',
              entityKey: account.key,
              defaultValue: address,
              networkSymbol: account.symbol,
              accountDescriptor: account.descriptor,
          } as const);
