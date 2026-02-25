# @suite/experimental-feedback

Redux state for collecting user feedback on experimental features.

## Purpose

Tracks how many times a user has interacted with each experimental feature and exposes a `pendingFeedbackFeature` field that drives the `ExperimentalFeedbackFormModalManager` component. The feedback modal is triggered in two situations:

- **Usage threshold** — automatically when a feature is used for the 3rd time (`FEEDBACK_THRESHOLD`)
- **Feature disabled** — explicitly when the user turns the feature off

## Actions

| Action | When to dispatch |
| --- | --- |
| `featureUsed(feature)` | Every time the user interacts with an experimental feature |
| `featureDisabled(feature)` | When the user turns a feature off; resets its usage count |
| `feedbackRequested(feature)` | To explicitly open the feedback modal (e.g. on feature toggle-off) |
| `feedbackDismissed()` | When the user closes the feedback modal |

### Toggle-off flow

Dispatch both actions — the first resets the count, the second opens the modal:

```ts
dispatch(featureDisabled(feature));
dispatch(feedbackRequested(feature));
```

## Selectors

| Selector | Returns |
| --- | --- |
| `selectPendingFeedbackFeature(state)` | The feature awaiting feedback, or `null` |
| `selectShouldShowFeedback(state, feature)` | Whether the usage threshold has been reached |
| `selectExperimentalFeatureUsageCount(state, feature)` | Raw usage count for a feature |
