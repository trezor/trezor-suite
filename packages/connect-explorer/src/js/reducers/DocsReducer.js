/* @flow */

import { 
    DOCS_LOADING,
    DOCS_LOADED,
    DOCS_ERROR,
} from '../actions/DocsActions';

type Docs = {
    name: string,
    loading: boolean,
    html: string,
}

const initialState: Array<Docs> = [];

const update = (state, docs) => {
    const current = state.find(d => d.name === docs.name);
    if (current) {
        const others = state.filter(d => d !== current);
        return [
            ...others,
            docs
        ]
    }

    return [
        ...state,
        docs,
    ]
    
}

export default function docs(state: Array<Docs> = initialState, action: any): any {

    switch (action.type) {
        case DOCS_LOADING:
        case DOCS_LOADED:
        case DOCS_ERROR:
            return update(state, action.docs);

        default: return state;
    }
}