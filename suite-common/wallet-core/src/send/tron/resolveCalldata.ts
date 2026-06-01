import { Calldata } from '@suite-common/calldata';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type CalldataResult = { data: string } | { data: null } | { error: string };

export const resolveCalldata = ({
    token,
    outputAddress,
    amountInSubunits,
    userCallDataHex,
}: {
    token: TokenInfo | undefined;
    outputAddress: string;
    amountInSubunits: string;
    userCallDataHex: string;
}): CalldataResult => {
    if (token) {
        const result = Calldata.tron.trc20.transfer.encode({
            to: outputAddress,
            amount: new BigNumber(amountInSubunits),
        });
        if (!result.data) return { error: 'Failed to build TRC-20 calldata.' };

        return { data: result.data.slice(2) };
    }

    if (userCallDataHex) return { data: userCallDataHex };

    return { data: null };
};
