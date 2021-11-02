# Debugging

## ?trezor-connect-src

We have introduced a feature to significantly help us debugging Connect issues. You can substitute the Connect version easily with the `?trezor-connect-src` parameter.

You can simply visit `https://suite.trezor.io/web/?trezor-connect-src=YOUR_CONNECT_BUILD` and Connect will be replaced by your own build.

This is extremely helpful along with the Connect's build and deploy features in its CI. You can create a new branch in Connect, push it, CI will build it, and if you run the manual deploy job it will also deploy it to `https://connect.corp.sldev.cz/[BRANCH_NAME]`. And then you can use `https://suite.trezor.io/web/?trezor-connect-src=https://connect.corp.sldev.cz/[BRANCH_NAME]` and you are testing the production build with _your_ Connect build.

And of course the Suite build does not have to be the production suite.trezor.io one. You can use this feature anywhere.

### Is it safe to have this enabled in production?

Only whitelisted domains are allowed so you can't replace the Connect URL with any random one. The list of whitelisted domains is:

-   trezor.io (production)
-   trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion (Tor production)
-   sldev.cz (development)
-   localhost

Also Bridge will not talk to any other endpoints than the above mentioned due to its CORS policy.
