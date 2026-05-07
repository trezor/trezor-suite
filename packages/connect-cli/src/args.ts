export const HELP = `@trezor/connect CLI arguments:

  Transport options (default: usb)
    --usb | --bridge | --udp | --bluetooth

  TrezorConnect logs (default: disabled)
    --debug                                   Enable TrezorConnect logs

  Interaction options (default: disabled)
    --debuglink                               Enable DebugLink decisions
                                                --debuglink           All decisions resolved
                                                --debuglink=pairing   THP pairing resolved
                                                --debuglink=button    Button_Request resolved

  THP Credentials options (default: none)
    --credentials                             Use THP credentials no autoconnect
    --autoconnect                             Use THP autoconnect credentials
                                                Run --test=get-credentials to create autoconnect credentials
                                                Credentials are stored in "thp-state.dat"

  THP Pairing methods (default: code)
    --pairing=code | qr | nfc | skip

  Passphrase
    --passphrase=<value>                      Use passphrase value (default: empty string)
    --passphrase-on-device                    Enter passphrase on device instead of host
    --cancel-passphrase                       Cancel the call when passphrase is requested
    --cancel-passphrase-ui                    Respond with missing payload (tests error handling)

  Method (default: GetAddress)
    --method=<name>                           Run TrezorConnect method
                                                --method=none (retrieve device Features and exit)
                                                --method=fw-update
                                                --method=get-credentials
                                                --method=get-account-info
                                                --method=get-account-descriptor
                                                --method=get-features
                                                --method=apply-settings
    --params=<json>                           Extra params passed to the method (JSON object)
                                                --params='{"use_passphrase": true}'
`;

// read and parse application arguments
const parseArgv = () => {
    const argv = process.argv.slice(2);
    const keys: string[] = [];
    const result: Record<string, any> = { _: keys };

    const add = (key: string, next?: string) =>
        next && !next.startsWith('-') && keys.push(key) > -1
            ? ((result[key] = next), true)
            : ((result[key] = true), false);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (key.includes('=')) {
                const [k, ...rest] = key.split('=');
                const v = rest.join('=');
                add(k, k === 'params' ? v : v.toLowerCase());
            } else if (add(key, argv[i + 1])) i++;
        } else if (arg.startsWith('-') && arg.length === 2) {
            if (add(arg[1], argv[i + 1])) i++;
        } else {
            keys.push(arg);
        }
    }

    return result;
};

export const args = parseArgv();
