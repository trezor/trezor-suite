# Feature Flags

Feature flags allow us to enable and disable certain features at build time, helping us to produce specific builds for specific environments.

## Work flow
All feature flags are located in `packages/suite/config/features.ts`. To add a new flag, start by doing the following:
1. Add your flag to the `FLAGS` constant and set its defautl value. When naming your flag, bear in mind the following conventions:
    1. Always explain what the flag is about using a comment next to it.
    2. The name of the flag should always be in capitals.
    3. The name of the flag should never contain the world `enable` or `disable` because the name should always towards an enabled state. Its value should reflect whether the feature is enabled or not.
    4. The name of the flag should never contain the word `flag` because it's inferred.
2. (optional) You can override the flag for each environment (web, desktop, landing) using their specific constants.
3. Use the `isEnabled` function from `@suite-utils/features` to check if the flag is enabled or not.
4. Wrap the code you wish to control in a condition checking for your flag being enabled or not.

## Example
```js
import { isEnabled } from '@suite-utils/features';

const main = () => {
    alwaysRunning();

    if (isEnabled('LABELING')) {
        myLabelingFeature();
    }
};
```

## Future evolutions
- Control feature flags at runtime.
