import type { AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import type { LabelingState } from './labelingReducer';
import { findAccountLabel, findAddressLabel, findOutputLabel } from './selectorUtils';

export type WithLabelingState = {
    labeling: LabelingState;
};

type SelectWalletLabelParams = {
    state: WithLabelingState;
    deviceStaticSessionId: StaticSessionId | undefined;
};

export const selectWalletLabel = ({
    state,
    deviceStaticSessionId,
}: SelectWalletLabelParams): string | null => {
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

type SelectAccountLabelParams = {
    state: WithLabelingState;
    walletDescriptor: WalletDescriptor;
    accountKey: AccountKey;
};

export const selectAccountLabel = ({
    state,
    walletDescriptor,
    accountKey,
}: SelectAccountLabelParams): string | null => {
    const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

    const walletLabelState = state.labeling.walletsLabels[walletDescriptor];

    if (walletLabelState === undefined) {
        return null;
    }

    return (
        findAccountLabel({
            accountLabels: walletLabelState.accountLabels,
            networkSymbol,
            accountDescriptor,
        })?.label ?? null
    );
};

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
    address: string | undefined;
};

export const selectAddressLabel = ({
    state,
    deviceStaticSessionId,
    address,
}: SelectAddressLabelParam): string | null => {
    if (address === undefined) {
        return null;
    }

    const addressLabels = selectAddressLabels({ state, deviceStaticSessionId });

    return findAddressLabel({ address, addressLabels })?.label ?? null;
};

export const selectOutputLabels = (
    state: WithLabelingState,
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return state.labeling.walletsLabels[walletDescriptor]?.outputLabels ?? [];
};

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
}: SelectOutputLabelParams): string | null => {
    const outputLabels = selectOutputLabels(state, deviceStaticSessionId);

    return findOutputLabel({ txId, outputIndex, outputLabels })?.label ?? null;
};
