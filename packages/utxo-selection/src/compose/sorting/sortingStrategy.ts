import { type CoinSelectSuccess } from '../../coinselect/types';
import {
    type ComposeChangeAddress,
    type ComposeFinalOutput,
    type ComposeInput,
    type ComposeRequest,
    type ComposedTransaction,
} from '../types';

type SortingStrategyParams<Input extends ComposeInput, Change extends ComposeChangeAddress> = {
    request: ComposeRequest<Input, ComposeFinalOutput, Change>;
    result: CoinSelectSuccess;
    convertedInputs: Input[];
};

export type SortingStrategy = <Input extends ComposeInput, Change extends ComposeChangeAddress>(
    params: SortingStrategyParams<Input, Change>,
) => ComposedTransaction<Input, ComposeFinalOutput, Change>;
