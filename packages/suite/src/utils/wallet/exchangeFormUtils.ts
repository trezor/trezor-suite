import { ExternalOutput } from '@wallet-types/sendForm';
import { amountToSatoshi, networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { ComposeOutput } from 'trezor-connect';
import { ComposeTransactionData } from '@wallet-types/transaction';
import { invityApiSymbolToSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';

export const getExternalComposeOutput = ({
    account,
    network,
    address,
    amount,
    token,
    isMaxActive,
    isInvity,
}: ComposeTransactionData) => {
    const formattedToken = isInvity ? invityApiSymbolToSymbol(token) : token;
    const tokenInfo = account.tokens?.find(t => t.symbol === formattedToken);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;
    const amountInSatoshi = amountToSatoshi(amount, decimals);
    let output: ExternalOutput;
    if (isMaxActive) {
        if (address) {
            output = {
                type: 'send-max',
                address,
            };
        } else {
            output = {
                type: 'send-max-noaddress',
            };
        }
    } else if (address) {
        output = {
            type: 'external',
            address,
            amount: amountInSatoshi,
        };
    } else {
        output = {
            type: 'noaddress',
            amount: amountInSatoshi,
        };
    }

    return {
        output,
        tokenInfo,
        decimals,
    };
};

export const getBitcoinComposeOutputs = ({
    account,
    address,
    amount,
    isMaxActive,
}: ComposeTransactionData) => {
    const result: ComposeOutput[] = [];

    if (isMaxActive) {
        if (address) {
            result.push({
                type: 'send-max',
                address,
            });
        } else {
            result.push({ type: 'send-max-noaddress' });
        }
    } else if (amount) {
        const formattedAmount = networkAmountToSatoshi(amount, account.symbol);
        if (address) {
            result.push({
                type: 'external',
                address,
                amount: formattedAmount,
            });
        } else {
            result.push({
                type: 'noaddress',
                amount: formattedAmount,
            });
        }
    }

    return result;
};
