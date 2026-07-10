import { Calldata } from '@suite-common/calldata';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getWrappedNativeAddress,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import type { AppState, Dispatch } from 'src/types/suite';

import { composeYieldEvmTransaction } from '../stablecoin-yield/composeYieldEvmTransaction';

export type ComposeWethUnwrapTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    amount: string;
    dispatch: Dispatch;
    getState: () => AppState;
};

const toWrappedNativeSubunits = (amount: string) =>
    unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
    });

export const composeWethUnwrapTransaction = ({
    account,
    amount,
    dispatch,
    getState,
}: ComposeWethUnwrapTransactionParams): Promise<string> => {
    const wethAddress = getWrappedNativeAddress(account.symbol);

    if (!wethAddress) {
        throw new Error(`Network ${account.symbol} has no wrapped native token.`);
    }

    const wethToken = account.tokens?.find(token =>
        isWrappedNativeToken(account.symbol, token.contract),
    );

    // The balance also feeds the INSUFFICIENT_BALANCE builder check below — never
    // compose an unwrap without a proven wrapped-native balance.
    if (!wethToken?.balance) {
        throw new Error('Account holds no wrapped native token to unwrap.');
    }

    const wad = toWrappedNativeSubunits(amount);
    const wethBalance = BigInt(toWrappedNativeSubunits(wethToken.balance).toFixed(0));

    const builderResult = Calldata.evm.weth.withdraw.encode({ wad }, { balance: wethBalance });

    if (!builderResult.isValid || !builderResult.data) {
        const issues = builderResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to encode unwrap calldata${issues ? `: ${issues}` : '.'}`);
    }

    return composeYieldEvmTransaction({
        account,
        to: wethAddress,
        data: builderResult.data,
        backupGasLimit: ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
        dispatch,
        getState,
    });
};
