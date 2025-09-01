import { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { AccountLabel } from './evolu/accountLabels';
import { AddressLabel } from './evolu/addressLabels';
import { OutputLabel } from './evolu/outputLabels';
import { LabelingState } from './labelingReducer';

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

type SelectAccountLabelsParams = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId;
};

export const selectAccountLabels = ({
    state,
    deviceStaticSessionId,
}: SelectAccountLabelsParams) => {
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

type SelectAddressLabelsParams = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId;
};

export const selectAddressLabels = ({
    state,
    deviceStaticSessionId,
}: SelectAddressLabelsParams) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.addressLabels ?? [];
};

type SelectAddressLabelParam = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId;
    address: string;
};

export const selectAddressLabel = ({
    state,
    deviceStaticSessionId,
    address,
}: SelectAddressLabelParam) => {
    const addressLabels = selectAddressLabels({ state, deviceStaticSessionId });

    return findAddressLabel({ address, addressLabels });
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
