import {
    ComposeRequest,
    CoinSelectSuccess,
    ComposeInput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposedTransaction,
    TransactionInputOutputSortingStrategy,
} from '../types';
import { noneSortingStrategy } from './sorting/noneSortingStrategy';
import { SortingStrategy } from './sorting/sortingStrategy';
import { bip69SortingStrategy } from './sorting/bip69SortingStrategy';

const resolveSortingStrategyWithBackCompatibility = <
    Input extends ComposeInput,
    Change extends ComposeChangeAddress,
>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
): TransactionInputOutputSortingStrategy => {
    if (request.sortingStrategy === undefined) {
        return request.skipPermutation === true ? 'none' : 'bip69';
    }

    return request.sortingStrategy;
};

const strategyMap: Record<TransactionInputOutputSortingStrategy, SortingStrategy> = {
    bip69: bip69SortingStrategy,
    none: noneSortingStrategy,
};

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
    result: CoinSelectSuccess,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const sortingStrategy = resolveSortingStrategyWithBackCompatibility(request);
    const convertedInputs = result.inputs.map(input => request.utxos[input.i]);

    return strategyMap[sortingStrategy]({ result, request, convertedInputs });
}
