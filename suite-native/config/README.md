# @suite-native/config

This package contains helper functions based on configuration variables for different environments of our React Native mobile application.

## Config variables

Config variables are defined in the root of the mobile app (**@suite-native/app**) in different files for every environment: .env.staging, .env.production, etc.

Add any new environment variable here.

Keep in mind this [module](https://www.npmjs.com/package/react-native-config) doesn't obfuscate or encrypt secrets for packaging, so **do not store sensitive keys in .env**
