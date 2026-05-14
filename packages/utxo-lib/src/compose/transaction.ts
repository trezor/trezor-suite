import {
    type CoinSelectSuccess,
    type ComposeChangeAddress,
    type ComposeFinalOutput,
    type ComposeInput,
    type ComposeRequest,
    type ComposedTransaction,
    type TransactionInputOutputSortingStrategy,
} from '../types';
import { bip69SortingStrategy } from './sorting/bip69SortingStrategy';
import { noneSortingStrategy } from './sorting/noneSortingStrategy';
import { randomSortingStrategy } from './sorting/randomSortingStrategy';
import { type SortingStrategy } from './sorting/sortingStrategy';

const strategyMap: Record<TransactionInputOutputSortingStrategy, SortingStrategy> = {
    bip69: bip69SortingStrategy,
    none: noneSortingStrategy,
    random: randomSortingStrategy,
};

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
    result: CoinSelectSuccess,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const convertedInputs = result.inputs.map(input => request.utxos[input.i]);

    return strategyMap[request.sortingStrategy]({ result, request, convertedInputs });
}
