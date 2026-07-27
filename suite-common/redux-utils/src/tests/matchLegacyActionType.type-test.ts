import { type Action } from 'redux';

import { type ActionFromMatcher, createLegacyActionTypeMatcher } from '../matchLegacyActionType';

type FirstAction = {
    type: 'first';
    payload: { first: string };
};

type SecondAction = {
    type: 'second';
    payload: { second: number };
};

type ThirdAction = {
    type: 'third';
    payload: { third: boolean };
};

type TestAction = FirstAction | SecondAction | ThirdAction;

const matchLegacyActionType = createLegacyActionTypeMatcher<TestAction>();
const firstOrSecondMatcher = matchLegacyActionType('first', 'second');

declare const action: TestAction;

if (firstOrSecondMatcher(action)) {
    const matchedAction: FirstAction | SecondAction = action;

    // @ts-expect-error The third action is not matched.
    const thirdAction: ThirdAction = action;

    void matchedAction;
    void thirdAction;
}

type MatchedAction = ActionFromMatcher<typeof firstOrSecondMatcher>;

declare const matchedAction: MatchedAction;
const firstOrSecondAction: FirstAction | SecondAction = matchedAction;

// @ts-expect-error The extracted action does not include the third action.
const thirdAction: ThirdAction = matchedAction;

const firstActionMatcher = (candidate: Action): candidate is FirstAction =>
    candidate.type === 'first';
type ActionFromTypeGuard = ActionFromMatcher<typeof firstActionMatcher>;

declare const actionFromTypeGuard: ActionFromTypeGuard;
const firstAction: FirstAction = actionFromTypeGuard;

// @ts-expect-error The action type is not part of TestAction.
matchLegacyActionType('fourth');

void firstOrSecondAction;
void thirdAction;
void firstActionMatcher;
void firstAction;
