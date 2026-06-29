import { createThunk } from '@suite-common/redux-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type Account,
    type FeeInfo,
    type FeeLevelLabel,
    type PrecomposedLevels,
} from '@suite-common/wallet-types';
import {
    findToken,
    getAccountIdentity,
    getEthereumEstimateFeeParams,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import type { TokenStandard } from '@trezor/blockchain-link-types';
import { BigNumber, typedObjectFromEntries } from '@trezor/utils';

import { ETHEREUM_ADJUST_GAS_LIMIT } from '../fees/feesUtils';
import { buildAllowanceTransaction } from '../allowance/buildAllowanceTransaction';
import { type ComposeFeeLevelsError } from '../send/sendFormTypes';

const NFT_MODULE_PREFIX = '@common/wallet-core/nfts';

export type ComposeNftTransactionThunkParams = {
    account: Account;
    feeInfo: FeeInfo;
    tokenContract: string;
    tokenId: string;
    standard: TokenStandard;
    recipient: string;
    amount: number;
    selectedFee?: FeeLevelLabel;
    customFee?: {
        feeLimit: string;
        feePerUnit: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
    };
};

export const composeNftTransactionThunk = createThunk<
    PrecomposedLevels,
    ComposeNftTransactionThunkParams,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${NFT_MODULE_PREFIX}/composeNftTransactionThunk`,
    async (
        { account, feeInfo, tokenContract, tokenId, recipient, amount, selectedFee, customFee },
        { rejectWithValue },
    ) => {
        const token = findToken(account.tokens, tokenContract);

        if (!token) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'NFT token not found in account tokens.',
            });
        }

        const estimateParams = getEthereumEstimateFeeParams(
            recipient,
            String(amount),
            token,
            undefined,
            account.descriptor,
            tokenId,
        );

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity: getAccountIdentity(account),
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...estimateParams,
                },
            },
        });

        let estimatedGasLimit: BigNumber;
        if (estimatedFee.success) {
            const { levels } = estimatedFee.payload;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstLevel: (typeof levels)[number] = levels[0];
            estimatedGasLimit = new BigNumber(
                firstLevel.feeLimit || ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
            );
        } else {
            estimatedGasLimit = new BigNumber(ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT);
        }

        const adjustedGasLimit = estimatedGasLimit
            .multipliedBy(ETHEREUM_ADJUST_GAS_LIMIT)
            .integerValue(BigNumber.ROUND_UP);

        const predefinedLevels = feeInfo.levels
            .filter(l => l.label !== 'custom')
            .map(l => ({ ...l, feeLimit: adjustedGasLimit.toFixed(0) }));

        if (selectedFee === 'custom' && customFee) {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: customFee.feePerUnit,
                feeLimit: customFee.feeLimit,
                maxFeePerGas: customFee.maxFeePerGas,
                maxPriorityFeePerGas: customFee.maxPriorityFeePerGas,
                blocks: -1,
            });
        }

        const levels = typedObjectFromEntries(
            predefinedLevels.map(level => [
                level.label,
                buildAllowanceTransaction(
                    account.availableBalance,
                    tokenContract,
                    level,
                    getNetworkDisplaySymbol(account.symbol),
                    token,
                    adjustedGasLimit.toFixed(0),
                ),
            ]),
        );

        return levels;
    },
);
