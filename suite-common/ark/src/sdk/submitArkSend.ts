import { type IWallet, type Recipient } from '@arkade-os/sdk';

import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';

export type ArkSendClientError =
    | {
          type: 'ArkSendInvalidAmount';
          message: string;
      }
    | {
          type: 'ArkSendFailed';
          message: string;
      };

type SubmitArkSendParams = {
    wallet: IWallet;
    address: string;
    amountSats: number;
};

// This submits an Ark send and resolves with the Arkade transaction id on
// round confirmation. Errors are mapped to a closed union so callers can
// surface them without inspecting raw SDK errors.
export const submitArkSend = async ({
    wallet,
    address,
    amountSats,
}: SubmitArkSendParams): Promise<Result<string, ArkSendClientError>> => {
    if (!Number.isInteger(amountSats) || amountSats <= 0) {
        return err({
            type: 'ArkSendInvalidAmount',
            message: `Amount must be a positive integer number of sats, received ${amountSats}.`,
        });
    }

    const recipient: Recipient = { address, amount: amountSats };

    try {
        const arkTxId = await wallet.send(recipient);

        return ok(arkTxId);
    } catch (error) {
        return err({
            type: 'ArkSendFailed',
            message: getErrorMessage(error),
        });
    }
};
