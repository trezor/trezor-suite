import type { BtcSwapComposeTemplate } from 'invity-api';

import { deriveBitcoinSwapFromAddresses } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type FeeInfo } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type BitcoinSwapComposeParams = {
    account: Account;
    btcSwapComposeTemplate: BtcSwapComposeTemplate | undefined;
    feeInfo: FeeInfo | null;
};

// Desktop no longer offers a fee choice in the swap form, so the swap is composed at the
// normal fee level there as well.
const getNormalFeePerUnit = (feeInfo: FeeInfo | null) =>
    feeInfo?.levels.find(level => level.label === 'normal')?.feePerUnit;

type GetBitcoinSwapFromAddressParams = BitcoinSwapComposeParams & {
    sendCryptoAmount: string;
    shouldSendInSats: boolean;
};

/**
 * Returns the input addresses of a simulated bitcoin swap transaction, joined by `;` as the quote
 * request `fromAddress` expects. DEX providers build the PSBT from the UTXOs of these addresses.
 */
export const getBitcoinSwapFromAddress = async ({
    account,
    btcSwapComposeTemplate,
    feeInfo,
    sendCryptoAmount,
    shouldSendInSats,
}: GetBitcoinSwapFromAddressParams): Promise<string | undefined> => {
    if (account.networkType !== 'bitcoin') {
        return undefined;
    }

    const network = getNetwork(account.symbol);
    const result = await deriveBitcoinSwapFromAddresses({
        account,
        network,
        sendStringAmount: sendCryptoAmount,
        decimals: network.decimals,
        feePerUnit: getNormalFeePerUnit(feeInfo),
        shouldSendInSats,
        btcSwapComposeTemplate,
    });

    return result?.addresses.join(';');
};

/**
 * Returns the maximum amount (in network units) of a bitcoin swap, which is lower than the max of
 * a regular send because the swap transaction carries the extra outputs of the compose template.
 */
export const getBitcoinSwapMaxAmount = async ({
    account,
    btcSwapComposeTemplate,
    feeInfo,
}: BitcoinSwapComposeParams): Promise<string | undefined> => {
    if (account.networkType !== 'bitcoin') {
        return undefined;
    }

    const network = getNetwork(account.symbol);
    const result = await deriveBitcoinSwapFromAddresses({
        account,
        network,
        sendStringAmount: '',
        decimals: network.decimals,
        setMaxOutputId: 0,
        feePerUnit: getNormalFeePerUnit(feeInfo),
        btcSwapComposeTemplate,
    });

    if (!result?.amount) {
        return undefined;
    }

    return subunitsToUnits({
        value: asAmountSubunit(new BigNumber(result.amount)),
        decimals: network.decimals,
    }).toFixed();
};
