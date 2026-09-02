import { yup } from '@suite-common/validators';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    getSolanaUnstakeAmountBounds,
    getStakingLimitsByNetworkSymbol,
    isDecimalsValid,
} from '@suite-common/wallet-utils';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export const SOLANA_UNSTAKE_AMOUNT_BOUNDS_ERROR = 'solana-unstake-amount-bounds';

export type UnstakeFormContext = {
    account?: Account;
    symbol?: NetworkSymbol;
    stakedBalance?: string;
    decimals?: number;
    translate: Translate;
};

export const unstakeFormValidationSchema = yup.object({
    amount: yup
        .string()
        .required('Amount is required.')
        .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
        .test('is-zero', 'Amount must be greater than 0.', function (value) {
            if (!value) return true;

            const { translate } = this.options.context as UnstakeFormContext;

            if (new BigNumber(value).isZero()) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.amountIsZero'),
                });
            }

            return true;
        })
        .test('max-amount', 'Amount exceeds maximum.', function (value) {
            const { symbol, translate } = this.options.context as UnstakeFormContext;

            if (!value || !symbol) return true;

            const limits = getStakingLimitsByNetworkSymbol(symbol);
            if (!limits) return true;

            if (new BigNumber(value).gt(limits.MAX_AMOUNT_FOR_STAKING)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.amountExceedsMax', {
                        maxAmount: limits.MAX_AMOUNT_FOR_STAKING.toString(),
                    }),
                });
            }

            return true;
        })
        .test(SOLANA_UNSTAKE_AMOUNT_BOUNDS_ERROR, 'Amount cannot be unstaked.', function (value) {
            const { account, translate } = this.options.context as UnstakeFormContext;

            if (!value || !account) return true;

            const bounds = getSolanaUnstakeAmountBounds(account, value);
            if (!bounds) return true;

            const symbol = getNetworkDisplaySymbol(account.symbol);
            const messageId = bounds.closestLower
                ? 'earn.unstakeFormScreen.validation.invalidUnstakeAmount'
                : 'earn.unstakeFormScreen.validation.invalidUnstakeAmountHigherOnly';

            return this.createError({
                message: translate(messageId, {
                    higher: `${bounds.closestHigher} ${symbol}`,
                    lower: bounds.closestLower ? `${bounds.closestLower} ${symbol}` : undefined,
                    higherFiat: '',
                    lowerFiat: '',
                }),
            });
        })
        .test('is-higher-than-staked', "You don't have enough staked balance.", function (value) {
            const { stakedBalance, translate } = this.options.context as UnstakeFormContext;

            if (!value || !stakedBalance) return true;

            if (new BigNumber(value).gt(stakedBalance)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.insufficientBalance'),
                });
            }

            return true;
        })
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { decimals = 8, translate } = this.options.context as UnstakeFormContext;

            if (!isDecimalsValid(value, decimals)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.tooManyDecimals'),
                });
            }

            return true;
        }),
    fiat: yup.string(),
});
