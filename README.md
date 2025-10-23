# Device checks playground

Easily test the UX of device checks failures by simulating them in Connect.

- [Run Suite Web](https://dev.suite.sldev.cz/suite-web/FW-check-UI-testing-branch/web) without device
  - also works with Suite Lite on local Android emu
- Open console
- Enter one of the following commands
- Connect device

```js
authenticityCheckOptiga = 'fail';
authenticityCheckTropic = 'fail';
authenticityCheckMCU = 'fail';
entropyCheck = 'fail';

hashCheck = 'other-error';
hashCheck = 'hash-mismatch';

revisionCheck = 'revision-mismatch';
revisionCheck = 'firmware-version-unknown';
revisionCheck = 'cannot-perform-check-offline';
revisionCheck = 'other-error';

device_id = null;
// only on 2nd and later connection:
internal_model = 'T1B1';
unit_color = 333;
```

You may reset the variables to `undefined`, set different ones and **reconnect device** without restarting Suite :)
