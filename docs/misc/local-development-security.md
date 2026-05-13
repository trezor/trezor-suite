# Local development security

Given the emerging supply chain attacks, it is not enough to rely on CI security checks.
Those only safeguard CI itself, and prevent merging compromised code to `develop`.
Additional hardening for local development is highly recommended for developers to work safely with npm packages (adding new npm packages, updating existing ones).

## Socket Firewall Free

`sfw` is a tool that wraps yarn, and scans packages that are being fetched from npm registry for known malicious code. <br />
Refer to [the official documentation](https://docs.socket.dev/docs/socket-firewall-free) for more details.

⚠️ Keep in mind that SFW is a **closed-source** binary made by Socket Dev,
and that it [sends telemetry without opt-out](https://docs.socket.dev/docs/socket-firewall-free#telemetry).
That's why it's only an optional suggestion.

### Setup:

```bash
npm i -g sfw
```

Edit `~/.zshrc` or `~/.bashrc`, depending on your shell, and add:

```bash
unalias yarn 2>/dev/null
yarn() {
  local -a positional
  local arg
  positional=()

  # get all positional arguments that are not flags or params
  for arg in "$@"; do
    case "$arg" in
      -*) continue ;;
      *) positional+=("$arg") ;;
    esac
  done

  # just `yarn` itself is an alias for `yarn install`, so wrap it with SFW
  if [ "${#positional[@]}" -eq 0 ]; then
    sfw yarn "$@"
    return
  fi

  # invoking a yarn command that can download packages, so wrap it with SFW
  for arg in "${positional[@]}"; do
    case "$arg" in
      install|add|remove|up|upgrade|upgrade-interactive|dedupe|dlx|create|focus)
        sfw yarn "$@"
        return
        ;;
    esac
  done

  # run original yarn command with unchanged process args
  command yarn "$@"
}
```

### Notes

To cover all cases, we need to alias `yarn` broadly, because just `yarn` itself is enough to install new packages (e.g. after modifying package.jsons with `ncu` or by agent).
But we cannot have each and every yarn script runs through `sfw`, because some scripts crash (e.g. `electron-builder` or `nx`).
That's why we cannot use simply `alias yarn='sfw yarn'`.
