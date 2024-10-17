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

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
    result: CoinSelectSuccess,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const sortingStrategy: TransactionInputOutputSortingStrategy =
        // eslint-disable-next-line no-nested-ternary
        request.sortingStrategy === undefined
            ? request.skipPermutation === true
                ? 'none'
                : 'bip69'
            : request.sortingStrategy;

    const convertedInputs = result.inputs.map(input => request.utxos[input.i]);

    const strategyMap: Record<TransactionInputOutputSortingStrategy, SortingStrategy> = {
        bip69: bip69SortingStrategy,
        none: noneSortingStrategy,
    };

    return strategyMap[sortingStrategy]({ result, request, convertedInputs });
}
