import type { 
    RouterHistory,
    Location as RouterLocation 
} from 'react-router';

declare module "react-router-redux" {

    // custom state for location
    declare export type LocationState = {[key: string] : string};

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
        // type: "@@router/LOCATION_CHANGE",
        payload: Location;
    }

    declare export type State = {
        location: Location; // should be ?Location
    }

    declare export function push(a: string): void;
    declare export function replace(a: string): void;
    declare export function go(a: string): void;
    declare export function goBack(): void;
    declare export function goForward(): void;
    
    //declare export function routerReducer<S, A>(state?: S, action: A): S;
    declare export function routerReducer(state?: State, action: any): State;
    declare export function routerMiddleware(history: any): any;

    declare export class ConnectedRouter extends React$Component<{
        history: any
      }> {}
}