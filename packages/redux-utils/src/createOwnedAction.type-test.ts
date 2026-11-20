import { type UnknownAction } from '@reduxjs/toolkit';

import { createOwnedAction } from './createOwnedAction';

const { create, matcher } = createOwnedAction('test/owned', (value: string) => ({
    payload: { value },
    meta: { isOwned: true },
}));

const action: UnknownAction = create('value');

if (matcher.match(action)) {
    const { value }: { value: string } = action.payload;
    const { isOwned }: { isOwned: boolean } = action.meta;

    void value;
    void isOwned;
}

const { type }: { type: 'test/owned' } = matcher;

void type;

// @ts-expect-error The matcher cannot create the action.
matcher('value');

// @ts-expect-error The matcher has no action creator.
matcher.create('value');
