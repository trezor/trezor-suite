import { CoinSelectionError } from '@fivebinaries/coin-selection';

export { trezorUtils, coinSelection } from '@fivebinaries/coin-selection';

export const asCoinSelectionError = (error: unknown) => {
    if (error instanceof CoinSelectionError) {
        return error;
    }
};
