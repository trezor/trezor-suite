import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor, AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { AccountLabel, AddressLabel, LabelingState, OutputLabel } from './labelingReducer';

export type WithLabelingState = {
    labeling: LabelingState;
};

type SelectWalletLabelParams = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId | undefined;
};

export const selectWalletLabel = ({ state, deviceStaticSessionId }: SelectWalletLabelParams) => {
    if (deviceStaticSessionId === undefined) {
        return null;
    }

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.walletLabel ?? null;
};

export const selectAccountLabels = (
    state: WithLabelingState,
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.accountLabels ?? [];
};

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

type SelectAccountLabelParams = {
    state: WithLabelingState;
    walletDescriptor: WalletDescriptor;
    accountKey: AccountKey;
};

export const selectAccountLabel = ({
    state,
    walletDescriptor,
    accountKey,
}: SelectAccountLabelParams) => {
    const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

    const walletLabelState = state.labeling.walletsLabels[walletDescriptor];

    if (walletLabelState === undefined) {
        return undefined;
    }

    return findAccountLabel({
        accountLabels: walletLabelState.accountLabels,
        networkSymbol,
        accountDescriptor,
    });
};

type FindAddressLabelParams = {
    addressLabels: AddressLabel[];
    address: string;
};

export const findAddressLabel = ({ addressLabels, address }: FindAddressLabelParams) =>
    addressLabels.find(it => it.address === address);

export const selectAddressLabels = (
    state: WithLabelingState,
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.addressLabels ?? [];
};

export const selectOutputLabels = (
    state: WithLabelingState,
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.outputLabels ?? [];
};

type FindOutputLabelParams = {
    outputLabels: OutputLabel[];
    txId: string;
    outputIndex: number;
};

export const findOutputLabel = ({ outputLabels, txId, outputIndex }: FindOutputLabelParams) =>
    outputLabels.find(it => it.txId === txId && it.outputIndex === outputIndex);

type SelectOutputLabelParams = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
};

export const selectOutputLabel = ({
    state,
    deviceStaticSessionId,
    txId,
    outputIndex,
}: SelectOutputLabelParams) => {
    const outputLabels = selectOutputLabels(state, deviceStaticSessionId);

    return findOutputLabel({ txId, outputIndex, outputLabels });
};
