import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';

type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type UpdateOutputLabel = (params: UpdateOutputLabelParams) => void;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
