import { type MockDeps } from './createMockDeps';

type GenericService = {
    identity: <T>(value: T) => T;
    dispatch: {
        <TAction extends { type: string }>(action: TAction): TAction;
        <TReturn>(thunk: () => TReturn): TReturn;
    };
};

declare const deps: MockDeps<GenericService>;

const _genericService: GenericService = deps;
const _literal = deps.identity({ value: 'literal' as const });
const _action = deps.dispatch({ type: 'action', payload: 42 as const });
const _thunkResult = deps.dispatch(() => Promise.resolve('result'));

const _literalValue: 'literal' = _literal.value;
const _actionPayload: 42 = _action.payload;
const _promiseResult: Promise<string> = _thunkResult;

void _genericService;
void _literalValue;
void _actionPayload;
void _promiseResult;
