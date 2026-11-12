export type FindQuerySelection = {
    anchor: number;
    focus: number;
};

export type FindQuerySnapshot = {
    query: string;
    selection: FindQuerySelection;
};

export type FindQueryState = FindQuerySnapshot & {
    past: FindQuerySnapshot[];
    future: FindQuerySnapshot[];
};

export type FindQueryDirection = 'left' | 'right' | 'home' | 'end';

const historyLimit = 50;

const clampIndex = (index: number, length: number): number => Math.min(Math.max(index, 0), length);

const collapsed = (index: number): FindQuerySelection => ({ anchor: index, focus: index });

export const createFindQueryState = (): FindQueryState => ({
    query: '',
    selection: collapsed(0),
    past: [],
    future: [],
});

export const getFindQueryRange = (
    selection: FindQuerySelection,
): { start: number; end: number } => ({
    start: Math.min(selection.anchor, selection.focus),
    end: Math.max(selection.anchor, selection.focus),
});

export const selectionFromInputOffsets = (
    start: number,
    end: number,
    direction: 'forward' | 'backward' | 'none' | null,
): FindQuerySelection => ({
    anchor: direction === 'backward' ? end : start,
    focus: direction === 'backward' ? start : end,
});

export const selectFindQuery = (
    state: FindQueryState,
    selection: FindQuerySelection,
): FindQueryState => {
    const anchor = clampIndex(selection.anchor, state.query.length);
    const focus = clampIndex(selection.focus, state.query.length);
    if (anchor === state.selection.anchor && focus === state.selection.focus) return state;

    return {
        ...state,
        selection: { anchor, focus },
    };
};

const recordQuery = (state: FindQueryState, next: FindQuerySnapshot): FindQueryState => {
    if (next.query === state.query) return selectFindQuery(state, next.selection);

    const past = [...state.past, { query: state.query, selection: state.selection }];

    return {
        query: next.query,
        selection: next.selection,
        past: past.length > historyLimit ? past.slice(past.length - historyLimit) : past,
        future: [],
    };
};

export const insertFindQueryText = (state: FindQueryState, text: string): FindQueryState => {
    const { start, end } = getFindQueryRange(state.selection);
    const query = state.query.slice(0, start) + text + state.query.slice(end);
    const caret = start + text.length;

    return recordQuery(state, { query, selection: collapsed(caret) });
};

export const replaceFindQuery = (
    state: FindQueryState,
    query: string,
    selection: FindQuerySelection,
): FindQueryState =>
    recordQuery(state, {
        query,
        selection: {
            anchor: clampIndex(selection.anchor, query.length),
            focus: clampIndex(selection.focus, query.length),
        },
    });

const isWordCharacter = (character: string | undefined): boolean =>
    character !== undefined && /[\p{L}\p{N}]/u.test(character);

const moveByWord = (query: string, index: number, direction: 'left' | 'right'): number => {
    let cursor = index;

    if (direction === 'left') {
        while (cursor > 0 && !isWordCharacter(query[cursor - 1])) cursor -= 1;
        while (cursor > 0 && isWordCharacter(query[cursor - 1])) cursor -= 1;

        return cursor;
    }

    while (cursor < query.length && !isWordCharacter(query[cursor])) cursor += 1;
    while (cursor < query.length && isWordCharacter(query[cursor])) cursor += 1;

    return cursor;
};

export const moveFindQueryCaret = (
    state: FindQueryState,
    direction: FindQueryDirection,
    options: { expand: boolean; byWord: boolean },
): FindQueryState => {
    const toEdge = direction === 'home' || direction === 'end';
    const towardsEnd = direction === 'right' || direction === 'end';
    const range = getFindQueryRange(state.selection);
    const hasRange = range.start !== range.end;

    if (!options.expand && hasRange && !toEdge && !options.byWord) {
        return selectFindQuery(state, collapsed(towardsEnd ? range.end : range.start));
    }

    const origin = state.selection.focus;
    let nextFocus: number;

    if (toEdge) {
        nextFocus = towardsEnd ? state.query.length : 0;
    } else if (options.byWord) {
        nextFocus = moveByWord(state.query, origin, towardsEnd ? 'right' : 'left');
    } else {
        nextFocus = towardsEnd ? Math.min(state.query.length, origin + 1) : Math.max(0, origin - 1);
    }

    const nextAnchor = options.expand ? state.selection.anchor : nextFocus;

    return selectFindQuery(state, { anchor: nextAnchor, focus: nextFocus });
};

export const deleteFindQueryBackward = (
    state: FindQueryState,
    boundary: 'character' | 'word' | 'line',
): FindQueryState => {
    const range = getFindQueryRange(state.selection);
    if (range.start !== range.end) return insertFindQueryText(state, '');

    const { focus } = state.selection;
    if (focus === 0) return state;

    let nextFocus = focus - 1;
    if (boundary === 'line') nextFocus = 0;
    if (boundary === 'word') nextFocus = moveByWord(state.query, focus, 'left');

    const query = state.query.slice(0, nextFocus) + state.query.slice(focus);

    return recordQuery(state, { query, selection: collapsed(nextFocus) });
};

export const deleteFindQueryForward = (
    state: FindQueryState,
    boundary: 'character' | 'word' | 'line',
): FindQueryState => {
    const range = getFindQueryRange(state.selection);
    if (range.start !== range.end) return insertFindQueryText(state, '');

    const { focus } = state.selection;
    if (focus === state.query.length) return state;

    let nextEnd = focus + 1;
    if (boundary === 'line') nextEnd = state.query.length;
    if (boundary === 'word') nextEnd = moveByWord(state.query, focus, 'right');

    const query = state.query.slice(0, focus) + state.query.slice(nextEnd);

    return recordQuery(state, { query, selection: collapsed(focus) });
};

export const selectAllFindQuery = (state: FindQueryState): FindQueryState =>
    selectFindQuery(state, { anchor: 0, focus: state.query.length });

export const undoFindQuery = (state: FindQueryState): FindQueryState => {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;

    return {
        ...previous,
        past: state.past.slice(0, -1),
        future: [...state.future, { query: state.query, selection: state.selection }],
    };
};

export const redoFindQuery = (state: FindQueryState): FindQueryState => {
    const next = state.future[state.future.length - 1];
    if (!next) return state;

    return {
        ...next,
        past: [...state.past, { query: state.query, selection: state.selection }],
        future: state.future.slice(0, -1),
    };
};
