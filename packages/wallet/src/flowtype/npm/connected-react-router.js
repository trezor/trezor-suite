import type {
    RouterHistory,
    Location as RouterLocation,
} from 'react-router';

declare module 'connected-react-router' {
    // custom state for location
    declare export type LocationState = {[key: string]: string};

    declare export type Location = {
        pathname: string,
        search: string,
        hash: string,
        key?: string,
        state: LocationState
    }

    declare export var LOCATION_CHANGE: "@@router/LOCATION_CHANGE";

    declare export type RouterAction = {
        type: typeof LOCATION_CHANGE,
        payload: {
            location: Location,
        },
    }

    declare export type State = {
        location: Location; // should be ?Location
    }

    declare export function push(a: string): RouterAction;
    declare export function replace(a: string): RouterAction;
    declare export function go(a: string): RouterAction;
    declare export function goBack(): RouterAction;
    declare export function goForward(): RouterAction;

    //declare export function routerReducer<S, A>(state?: S, action: A): S;
    declare export function routerReducer(state?: State, action: any): State;
    declare export function routerMiddleware(history: any): any;
    declare export function connectRouter(history: any): any;

    declare export class ConnectedRouter extends React$Component<{
        history: any
    }> {}
}