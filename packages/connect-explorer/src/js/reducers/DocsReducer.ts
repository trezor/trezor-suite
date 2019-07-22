import { DOCS_LOADING, DOCS_LOADED, DOCS_ERROR } from '../actions/DocsActions';

interface Docs {
    name: string;
    loading: boolean;
    html: string;
}

type State = Docs[];

const initialState: State = [];

const update = (state: State, docs) => {
    const current = state.find(d => d.name === docs.name);
    if (current) {
        const others = state.filter(d => d !== current);
        return [...others, docs];
    }

    return [...state, docs];
};

export default function docs(state: State = initialState, action) {
    switch (action.type) {
        case DOCS_LOADING:
        case DOCS_LOADED:
        case DOCS_ERROR:
            return update(state, action.docs);

        default:
            return state;
    }
}
