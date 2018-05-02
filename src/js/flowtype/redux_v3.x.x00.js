// flow-typed signature: ba132c96664f1a05288f3eb2272a3c35
// flow-typed version: c4bbd91cfc/redux_v3.x.x/flow_>=v0.33.x
// from : https://github.com/hmeerlo/redux-thunk-flow/blob/master/flow-typed/npm/redux_v3.x.x.js
// declare module 'redux' {

//   /*

//     S = State
//     A = Action

//   */

//   /* NEW: We create a few extra action and dispatch types */
//   declare export type ThunkAction<S, R> = (dispatch: Dispatch<S, any>, getState: () => S) => R;
//   declare type PromiseAction<R> = { type: string, payload: Promise<R> };
//   declare type ThunkDispatch<S> = <R>(action: ThunkAction<S, R>) => R;
//   declare type PromiseDispatch = <R>(action: PromiseAction<R>) => Promise<R>;
//   declare type PlainDispatch<A: {type: $Subtype<string>}> = (action: A) => A;
//   /* NEW: Dispatch is now a combination of these different dispatch types */
//   declare export type Dispatch<S, A> = PlainDispatch<A> & ThunkDispatch<S> & PromiseDispatch;

//   declare export type MiddlewareAPI<S, A> = {
//     dispatch: Dispatch<S, A>;
//     getState(): S;
//   };

//   declare export type Store<S, A> = {
//     // rewrite MiddlewareAPI members in order to get nicer error messages (intersections produce long messages)
//     dispatch: Dispatch<S, A>;
//     getState(): S;
//     subscribe(listener: () => void): () => void;
//     replaceReducer(nextReducer: Reducer<S, A>): void
//   };

//   declare type Reducer<S, A> = (state: S, action: A) => S;

//   declare export type Middleware<S, A> =
//     (api: MiddlewareAPI<S, A>) =>
//       (next: Dispatch<S, A>) => Dispatch<S, A>;

//   declare type StoreCreator<S, A> = {
//     (reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A>): Store<S, A>;
//     (reducer: Reducer<S, A>, preloadedState: S, enhancer?: StoreEnhancer<S, A>): Store<S, A>;
//   };

//   declare type StoreEnhancer<S, A> = (next: StoreCreator<S, A>) => StoreCreator<S, A>;

//   declare function createStore<S, A>(reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A>): Store<S, A>;
//   declare function createStore<S, A>(reducer: Reducer<S, A>, preloadedState: S, enhancer?: StoreEnhancer<S, A>): Store<S, A>;

//   declare function applyMiddleware<S, A>(...middlewares: Array<Middleware<S, A>>): StoreEnhancer<S, A>;

//   declare type ActionCreator<A, B> = (...args: Array<B>) => A;
//   declare type ActionCreators<K, A> = { [key: K]: ActionCreator<A, any> };

//   declare function bindActionCreators<S, A, C: ActionCreator<A, any>>(actionCreator: C, dispatch: Dispatch<S, A>): C;
//   declare function bindActionCreators<S, A, K, C: ActionCreators<K, A>>(actionCreators: C, dispatch: Dispatch<S, A>): C;

//   declare function combineReducers<O: Object, A>(reducers: O): Reducer<$ObjMap<O, <S>(r: Reducer<S, any>) => S>, A>;

//   declare function compose<S, A>(...fns: Array<StoreEnhancer<S, A>>): Function;

// }



// flow-typed signature: cca4916b0213065533df8335c3285a4a
// flow-typed version: cab04034e7/redux_v3.x.x/flow_>=v0.55.x

declare module 'redux' {

    /*
  
      S = State
      A = Action
      D = Dispatch
  
    */
  
    declare export type DispatchAPI<A> = (action: A) => A;
    // declare export type Dispatch<A: { type: $Subtype<string> }> = DispatchAPI<A>;

    declare export type ThunkAction<S, A> = (dispatch: Dispatch<S, any>, getState: () => S) => Promise<void> | void;
    declare export type ThunkDispatch<S, A> = (action: ThunkAction<S, A>) => void;

    declare export type PlainDispatch<A: {type: $Subtype<string>}> = DispatchAPI<A>;
    /* NEW: Dispatch is now a combination of these different dispatch types */
    declare export type Dispatch<S, A> = PlainDispatch<A> & ThunkDispatch<S, A>;

    // declare export type ThunkAction<S, D> = (dispatch: D, getState: () => S) => Promise<void> | void;
    // declare type ThunkDispatch<S, D> = (action: ThunkAction<S, D & ThunkDispatch<S, D>>) => void;
  
    declare export type MiddlewareAPI<S, A> = {
      dispatch: Dispatch<S, A>;
      getState(): S;
    };
  
    declare export type Store<S, A, D = Dispatch<S, A>> = {
      // rewrite MiddlewareAPI members in order to get nicer error messages (intersections produce long messages)
      dispatch: D;
      getState(): S;
      subscribe(listener: () => void): () => void;
      replaceReducer(nextReducer: Reducer<S, A>): void
    };
  
    declare export type Reducer<S, A> = (state: S | void, action: A) => S;
  
    declare export type CombinedReducer<S, A> = (state: $Shape<S> & {} | void, action: A) => S;
  
    declare export type Middleware<S, A> =
      (api: MiddlewareAPI<S, A>) =>
        (next: PlainDispatch<A>) => PlainDispatch<A>;
  
    declare export type StoreCreator<S, A, D = Dispatch<S, A>> = {
      (reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
      (reducer: Reducer<S, A>, preloadedState: S, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
    };
  
    declare export type StoreEnhancer<S, A, D = Dispatch<S, A>> = (next: StoreCreator<S, A, D>) => StoreCreator<S, A, D>;
  
    declare export function createStore<S, A, D>(reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
    declare export function createStore<S, A, D>(reducer: Reducer<S, A>, preloadedState?: S, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>;
  
    declare export function applyMiddleware<S, A, D>(...middlewares: Array<Middleware<S, A>>): StoreEnhancer<S, A, D>;
  
    declare export type ActionCreator<A, B> = (...args: Array<B>) => A;
    declare export type ActionCreators<K, A> = { [key: K]: ActionCreator<A, any> };
  
    declare export function bindActionCreators<A, C: ActionCreator<A, any>, D: DispatchAPI<A>>(actionCreator: C, dispatch: D): C;
    declare export function bindActionCreators<A, K, C: ActionCreators<K, A>, D: DispatchAPI<A>>(actionCreators: C, dispatch: D): C;
    // declare export function bindActionCreators<A, C: ActionCreator<A, any>, D: Dispatch>(actionCreator: C, dispatch: D): C;
    // declare export function bindActionCreators<A, K, C: ActionCreators<K, A>, D: Dispatch>(actionCreators: C, dispatch: D): C;
  
    declare export function combineReducers<O: Object, A>(reducers: O): CombinedReducer<$ObjMap<O, <S>(r: Reducer<S, any>) => S>, A>;
  
    declare export var compose: $Compose;
  }
  