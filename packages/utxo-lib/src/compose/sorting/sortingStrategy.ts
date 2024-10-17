import {
    CoinSelectSuccess,
    ComposeChangeAddress,
    ComposedTransaction,
    ComposeFinalOutput,
    ComposeInput,
    ComposeRequest,
} from '../../types';

type SortingStrategyParams<Input extends ComposeInput, Change extends ComposeChangeAddress> = {
    request: ComposeRequest<Input, ComposeFinalOutput, Change>;
    result: CoinSelectSuccess;
    convertedInputs: Input[];
};

export type SortingStrategy = <Input extends ComposeInput, Change extends ComposeChangeAddress>(
    params: SortingStrategyParams<Input, Change>,
) => ComposedTransaction<Input, ComposeFinalOutput, Change>;
