import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';

export type UpdateAddressLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: Account['descriptor'];
    networkSymbol: NetworkSymbol;
};

export type UpdateAddressLabel = (params: UpdateAddressLabelParams) => void;

export type UpdateAddressLabelDep = { updateAddressLabel: UpdateAddressLabel };
