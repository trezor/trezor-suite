/* @flow */

declare module 'redux' {
  /*
    S = State
    A = Action
    D = Dispatch
    R = Promise response
  */

  declare export type DispatchAPI<A> = (action: A) => A;
  // old Dispatch needs to stay as it is, because also "react-redux" is using this type
  declare export type Dispatch<A: { type: $Subtype<string> }> = DispatchAPI<A>;

  declare export type ThunkAction<S, A> = (dispatch: ReduxDispatch<S, A>, getState: () => S) => void;
  declare export type AsyncAction<S, A> = (dispatch: ReduxDispatch<S, A>, getState: () => S) => Promise<void>;
  declare export type PromiseAction<S, A, R> = (dispatch: ReduxDispatch<S, A>, getState: () => S) => Promise<R>;
  declare export type PayloadAction<S, A, R> = (dispatch: ReduxDispatch<S, A>, getState: () => S) => R;

  declare export type ThunkDispatch<S, A> = (action: ThunkAction<S, A>) => void;
  declare export type AsyncDispatch<S, A> = (action: AsyncAction<S, A>) => Promise<void>;
  declare export type PromiseDispatch<S, A> = <R>(action: PromiseAction<S, A, R>) => Promise<R>;
  declare export type PayloadDispatch<S, A> = <R>(action: PayloadAction<S, A, R>) => R;
  declare export type PlainDispatch<A: {type: $Subtype<string>}> = DispatchAPI<A>;
  /* NEW: Dispatch is now a combination of these different dispatch types */
  declare export type ReduxDispatch<S, A> = PlainDispatch<A> & ThunkDispatch<S, A> & AsyncDispatch<S, A> & PromiseDispatch<S, A> & PayloadDispatch<S, A>;

  declare export type MiddlewareAPI<S, A> = {
    dispatch: ReduxDispatch<S, A>;
    getState(): S;
  };

  declare export type Middleware<S, A> =
    (api: MiddlewareAPI<S, A>) =>
      (next: PlainDispatch<A>) =>
        (PlainDispatch<A> | (action: A) => Promise<A>);

  declare export type Store<S, A, D = ReduxDispatch<S, A>> = {
    // rewrite MiddlewareAPI members in order to get nicer error messages (intersections produce long messages)
    dispatch: D;
    getState(): S;
    subscribe(listener: () => void): () => void;
    replaceReducer(nextReducer: Reducer<S, A>): void
  };

  declare export type Reducer<S, A> = (state: S | void, action: A) => S;

  declare export type CombinedReducer<S, A> = (state: $Shape<S> & {} | void, action: A) => S;

  declare export type StoreCreator<S, A, D = ReduxDispatch<S, A>> = {
    (reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
    (reducer: Reducer<S, A>, preloadedState: S, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
  };

  declare export type StoreEnhancer<S, A, D = ReduxDispatch<S, A>> = (next: StoreCreator<S, A, D>) => StoreCreator<S, A, D>;

  declare export function createStore<S, A, D>(reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
  declare export function createStore<S, A, D>(reducer: Reducer<S, A>, preloadedState?: S, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;

  declare export function applyMiddleware<S, A, D>(...middlewares: Array<Middleware<S, A>>): StoreEnhancer<S, A, D>;

  // declare export type ActionCreator<A, B> = (...args: Array<B>) => A;
  declare export type ActionCreator<A, B> = (...args: Array<B>) => any;
  declare export type ActionCreators<K, A> = { [key: K]: ActionCreator<A, any> };

  declare export function bindActionCreators<A, C: ActionCreator<A, any>, D: ReduxDispatch<any, A>>(actionCreator: C, dispatch: D): C;
  declare export function bindActionCreators<A, K, C: ActionCreators<K, A>, D: ReduxDispatch<any, A>>(actionCreators: C, dispatch: D): C;
  // declare export function bindActionCreators<A, C: ActionCreator<A, any>, D: Dispatch>(actionCreator: C, dispatch: D): C;
  // declare export function bindActionCreators<A, K, C: ActionCreators<K, A>, D: Dispatch>(actionCreators: C, dispatch: D): C;

  declare export function combineReducers<O: Object, A>(reducers: O): CombinedReducer<$ObjMap<O, <S>(r: Reducer<S, any>) => S>, A>;

  declare export var compose: $Compose;
}
