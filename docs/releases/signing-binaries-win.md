# Signing binaries win

The desktop build of Trezor Suite uses [electron-builder](https://github.com/electron-userland/electron-builder) for signing the package and the binaries inside.

In order to be able to sign all the binaries for windows in other operating systems [electron-builder] uses [osslsigncode](https://github.com/mtrojnar/osslsigncode).

## Check if binaries are signed for windows in Linux

The installer `.exe` can be unpacked with `7za x Trezor-Suite-22.2.1-win-x64.exe` on Linux. The `chktrust` is from mono-develop package (Ubuntu LTS, other distros will have it under similar name).

```bash
7za x Trezor-Suite-22.2.1-win-x64.exe
```

After unpacked, test signatures:

```bash
for I in **/*.exe **/*.dll; do echo "---Checking $I"---; chktrust "$I"; done
```

## CI signing details for windows

Certificate file is with extension: `.pfx`
Env variables for signing: `WIN_CSC_KEY_PASSWORD` `WIN_CSC_LINK`.

## Creating Self-signed pfx and cer certificates with OpenSSL

Generate directly the pem:

```bash
openssl req -x509 -days 365 -newkey rsa:2048 -keyout cert.pem -out cert.pem
```

The pem cannot be used with Microsoft products, so we need to convert it to PKCS#12/PFX Format which is what Microsoft uses.

```bash
openssl pkcs12 -export -in cert.pem -inkey cert.pem -out cert.pfx
```
