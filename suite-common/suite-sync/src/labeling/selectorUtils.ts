import { AccountLabel, AddressLabel, OutputLabel } from '@suite-common/suite-sync-storage';
import { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';

type FindAccountLabelParams = {
    accountLabels: AccountLabel[];
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const findAccountLabel = ({
    accountLabels,
    accountDescriptor,
    networkSymbol,
}: FindAccountLabelParams) =>
    accountLabels.find(
        it => it.accountDescriptor === accountDescriptor && it.networkSymbol === networkSymbol,
    );

type FindAddressLabelParams = {
    addressLabels: AddressLabel[];
    address: string;
};

export const findAddressLabel = ({ addressLabels, address }: FindAddressLabelParams) =>
    addressLabels.find(it => it.address === address);

type FindOutputLabelParams = {
    outputLabels: OutputLabel[];
    txId: string;
    outputIndex: number;
};

export const findOutputLabel = ({ outputLabels, txId, outputIndex }: FindOutputLabelParams) =>
    outputLabels.find(it => it.txId === txId && it.outputIndex === outputIndex);
