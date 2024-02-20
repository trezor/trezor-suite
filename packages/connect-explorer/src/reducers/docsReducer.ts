import { DOCS_LOADING, DOCS_LOADED, DOCS_ERROR } from '../actions/docsActions';
import { Action } from '../types';

export interface Docs {
    name: string;
    loading: boolean;
    html: string;
}

const initialState: Docs[] = [];

const update = (state: Docs[], docs: Docs) => {
    const current = state.find(d => d.name === docs.name);
    if (current) {
        const others = state.filter(d => d !== current);

        return [...others, docs];
    }

    return [...state, docs];
};

export default function docs(state: Docs[] = initialState, action: Action) {
    switch (action.type) {
        case DOCS_LOADING:
        case DOCS_LOADED:
        case DOCS_ERROR:
            return update(state, action.docs);

        default:
            return state;
    }
}
