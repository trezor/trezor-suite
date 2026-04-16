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
    --passphrase=<value>                      Use passphrase (default: empty)

  Method (default: GetAddress)
    --method <name>                           Run TrezorConnect method
                                                --method=none (retrieve device Features and exit)
                                                --method=fw-update
                                                --method=get-credentials
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
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const arg: string = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (key.includes('=')) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const [k]: [string] = key.split('=');
                const v = key.split('=')[1];
                add(k, v?.toLowerCase());
            } else {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const nextArg: string = argv[i + 1];
                if (add(key, nextArg)) i++;
            }
        } else if (arg.startsWith('-') && arg.length === 2) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const flag: string = arg[1];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const nextArg: string = argv[i + 1];
            if (add(flag, nextArg)) i++;
        } else {
            keys.push(arg);
        }
    }

    return result;
};

export const args = parseArgv();
