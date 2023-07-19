# Feature Flags

Feature flags allow us to enable and disable certain features at build time, helping us to produce specific builds for specific environments.

## Workflow

All feature flags are located in `suite-common/suite-config/src/features.ts`. To add a new flag, start by doing the following:

1. Add your flag to the `FLAGS` constant and set its default value. When naming your flag, bear in mind the following conventions:
    1. Always explain what the flag is about using a comment next to it.
    1. The name of the flag should always be in capitals.
    1. The name of the flag should never contain the world `enable` or `disable` because the name should always towards an enabled state. Its value should reflect whether the feature is enabled or not.
    1. The name of the flag should never contain the word `flag` because it's inferred.
1. (optional) You can override the flag for each environment (web, desktop) using their specific constants.
1. Use the `isFeatureFlagEnabled` function from `@suite-utils/features` to check if the flag is enabled or not.
1. Wrap the code you wish to control in a condition checking for your flag being enabled or not.

## Example

```js
import { isFeatureFlagEnabled } from '@suite-utils/features';

const main = () => {
    alwaysRunning();

    if (isFeatureFlagEnabled('LABELING')) {
        myLabelingFeature();
    }
};
```

## Future evolutions

-   Control feature flags at runtime.
