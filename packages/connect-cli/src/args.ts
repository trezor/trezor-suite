export const HELP = `@trezor/connect CLI arguments:

  Transport options (default: usb)
    yarn workspace @trezor/connect-cli [usb | bridge | udp | bluetooth]

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
    --method=<name>                           Run TrezorConnect method (comma-separated to run multiple)
                                                --method=none (retrieve device Features and exit)
                                                --method=fw-update
                                                --method=get-credentials
                                                --method=get-account-info
                                                --method=get-features
                                                --method=apply-settings
                                                --method=authenticate-device
                                                --method=dblookup    Look up a Bitcoin address in the local SQLite DB
                                                --method=dbchange    Upsert metadata for a Bitcoin address in the local SQLite DB
                                                --method=dbapprove   Approve an address record on device; stores MAC signature in DB
                                                --method=dbsetroot   Send stored root + MAC from DB to device (for initial sync)
                                                --method=dblistroots List stored Merkle root(s) from local DB; prints ready-to-run dbsetroot command
                                                --method=dbclear     Clear the Merkle root on device and wipe the local DB
                                                --method=dbsetdeviceid Set the authdb device identifier on the Trezor (for testing cross-device sync)
                                                --method=dbqueueoffline   Queue a signed offline operation on the device (no host DB round-trip)
                                                --method=dbgetofflineops  Drain the device's offline queue and persist it into the local DB
                                                --method=dbdeleteofflineops Garbage-collect applied offline operations from the device queue
                                                --method=dbfastforward    Fast-forward the device to the wallet's latest attested root (skip-ahead)
                                                --method=dbsyncoffline    Full sync: drain, rebase with conflict detection, and apply the offline queue
                                                --method=dbhistory        Print the local cross-device apply history for an address
    --params=<json>                           Extra params passed to the method (JSON object)
                                                --params='{"use_passphrase": true}'

  Database shorthand flags (without --method=)
    --dblistroots                             List stored Merkle root(s) from local DB; prints ready-to-run dbsetroot command
                                                Requires either --db-path (no device needed) or a connected device to derive the path

  Database options
    --db-path=<path>                          Path to the SQLite DB file (default: ~/.trezor/auth_database_<identifier>.db)
    --wallet-id=<id>                          Wallet whose root checkpoint to read/write in tree_state (default: "default")
                                                Lets one shared DB track a separate checkpoint per wallet.
    --db-params=<json>                        Params for database commands (JSON object)
                                                --db-params='{"address":"bc1q...","networkSymbol":"btc"}' (dblookup, dbapprove)
                                                --db-params='{"address":"bc1q...","networkSymbol":"btc","metadata":{"label":"My wallet"}}' (dbchange; pre-approval mac/deviceId from a prior dbapprove are picked up automatically)
                                                --db-params='{"deviceId":"<hex>"}' (dbsetdeviceid)
                                                --db-params='{"address":"<hex>","oldValue":"<hex>","newValue":"<hex>","newCounter":<n>}' (dbqueueoffline; oldValue "" = insert, newValue "" = delete; newCounter: 1 on insert, oldCounter+1 otherwise)
                                                --db-params='{"address":"<hex>"}' (dbhistory)
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
        const nextIndex = i + 1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const arg: string = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (key.includes('=')) {
                const [preKey, ...rest] = key.split('=');
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const k: string = preKey;
                const v = rest.join('=');
                add(k, k === 'params' || k === 'db-params' ? v : v.toLowerCase());
            } else if (add(key, argv[i + 1])) i++;
        } else if (arg.startsWith('-') && arg.length === 2) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const flag: string = arg[1];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const nextArg: string = argv[nextIndex];
            if (add(flag, nextArg)) i++;
        } else {
            keys.push(arg);
        }
    }

    return result;
};

export const args = parseArgv();
