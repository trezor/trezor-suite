import type { BtcSwapComposeTemplate } from 'invity-api';

import { deriveBitcoinSwapFromAddresses } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type FeeInfo } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type BitcoinExchangeComposeParams = {
    account: Account;
    btcSwapComposeTemplate: BtcSwapComposeTemplate | undefined;
    feeInfo: FeeInfo | null;
};

const getNormalFeePerUnit = (feeInfo: FeeInfo | null) =>
    feeInfo?.levels.find(level => level.label === 'normal')?.feePerUnit;

type GetBitcoinExchangeFromAddressParams = BitcoinExchangeComposeParams & {
    sendCryptoAmount: string;
    shouldSendInSats: boolean;
};

/**
 * Returns the input addresses of a simulated bitcoin swap transaction, joined by `;` as the quote
 * request `fromAddress` expects. DEX providers build the PSBT from the UTXOs of these addresses.
 */
export const getBitcoinExchangeFromAddress = async ({
    account,
    btcSwapComposeTemplate,
    feeInfo,
    sendCryptoAmount,
    shouldSendInSats,
}: GetBitcoinExchangeFromAddressParams): Promise<string | undefined> => {
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
    }).catch(() => undefined);

    return result?.addresses.join(';');
};

/**
 * Returns the maximum amount (in network units) of a bitcoin swap, which is lower than the max of
 * a regular send because the swap transaction carries the extra outputs of the compose template.
 */
export const getBitcoinExchangeMaxAmount = async ({
    account,
    btcSwapComposeTemplate,
    feeInfo,
}: BitcoinExchangeComposeParams): Promise<string | undefined> => {
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
    }).catch(() => undefined);

    if (!result?.amount) {
        return undefined;
    }

    return subunitsToUnits({
        value: asAmountSubunit(new BigNumber(result.amount)),
        decimals: network.decimals,
    }).toFixed();
};
