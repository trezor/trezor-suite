import { AccountLabel, AddressLabel, LabelingState, OutputLabel } from './labelingReducer';

export type WithLabelingState = {
    labeling: LabelingState;
};

export const selectWalletLabels = (state: WithLabelingState) => state.labeling.walletLabels;

type SelectWalletLabelParams = {
    state: WithLabelingState;
    deviceStaticSessionId: string | undefined;
};

export const selectWalletLabel = ({ state, deviceStaticSessionId }: SelectWalletLabelParams) =>
    deviceStaticSessionId !== undefined
        ? state.labeling.walletLabels.find(it => it.deviceStaticSessionId === deviceStaticSessionId)
        : undefined;

export const selectAccountLabels = (state: WithLabelingState) => state.labeling.accountLabels;

type FindAccountLabelParams = {
    accountLabels: AccountLabel[];
    accountKey: string;
    deviceStaticSessionId: string;
};

export const findAccountLabel = ({
    accountLabels,
    accountKey,
    deviceStaticSessionId,
}: FindAccountLabelParams) =>
    accountLabels.find(
        it => it.accountKey === accountKey && it.deviceStaticSessionId === deviceStaticSessionId,
    );

type SelectAccountLabelParams = {
    state: WithLabelingState;
    accountKey: string;
    deviceStaticSessionId: string;
};

export const selectAccountLabel = ({
    state,
    accountKey,
    deviceStaticSessionId,
}: SelectAccountLabelParams) =>
    findAccountLabel({
        accountLabels: state.labeling.accountLabels,
        accountKey,
        deviceStaticSessionId,
    });

type FindAddressLabelParams = {
    addressLabels: AddressLabel[];
    address: string;
};

export const findAddressLabel = ({ addressLabels, address }: FindAddressLabelParams) =>
    addressLabels.find(it => it.address === address);

export const selectAddressLabels = (state: WithLabelingState) => state.labeling.addressLabels;

export const selectOutputLabels = (state: WithLabelingState) => state.labeling.outputLabels;

type FindOutputLabelParams = {
    outputLabels: OutputLabel[];
    txId: string;
    outputIndex: number;
};

export const findOutputLabel = ({ outputLabels, txId, outputIndex }: FindOutputLabelParams) =>
    outputLabels.find(it => it.txId === txId && it.outputIndex === outputIndex);
