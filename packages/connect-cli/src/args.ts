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
    --method=<name>                           Run TrezorConnect method
                                                --method=none (retrieve device Features and exit)
                                                --method=fw-update
                                                --method=get-credentials
                                                --method=get-account-info
                                                --method=get-features
                                                --method=apply-settings
                                                --method=authenticate-device
                                                --method=nostr-get-public-key
                                                --method=nostr-sign-event
                                                --method=ward_add        (wired, --queue only)
                                                --method=ward_backup    (wired, --queue only)
                                                --method=ward_restore   (wired, --queue only)
                                                --method=ward_delete     (wired, --queue only)
                                                --method=ward_update    (not wired yet)
                                                --method=ward_display   (not wired yet)
    --params=<json>                           Extra params passed to the method (JSON object)
                                                --params='{"use_passphrase": true}'

  WARD options (default: disabled)
    --queue                                   Operate on the device's own queue instead of the
                                                tree. It picks a different wire message --
                                                WardQueueSetEntry rather than WardSetEntry -- so
                                                the change is HELD on the device and published
                                                later; the applying request refuses without a
                                                synced session rather than queueing silently.
                                                --method=ward_add --params='{"scope":"example.com","value":"secret"}'

  WARD entry flags (an alternative to --params, and required by backup/restore)
    --appid=<domain>                          Domain that owns the entry
    --ident=<key>                             Key within that domain (e.g. an address)
    --value=<value>                           Value to queue (ward_add)
    --entry=<0x...>                           A backup from ward_backup (ward_restore)
    --target=<VAR>                            ward_backup only: print VAR=0x... on stdout instead
                                                of the blob, for eval "$(... --target=VAR)"
    --compact                                 ward_add/ward_restore: keep a hash of the identity on
                                                the device instead of the identity itself. Smaller
                                                record; publishing it then needs the entry named.
                                                Values are taken verbatim -- unlike other flags
                                                they are NOT lowercased, because the device hashes
                                                appid and ident.

  Backing the queue up (both --queue only)
    --method=ward_backup --queue --appid=example.com --ident=addr1
                                              Prints 0x... -- the queued change, with a MAC the
                                                device made, so it can be handed back later.
    --method=ward_restore --queue --entry=0x...
                                              Puts that change back into the queue. The device
                                                verifies the MAC before it shows or writes anything.
    --method=ward_delete --queue --appid=example.com --ident=addr1
                                              Discards a queued change. Reports missing when there
                                                was none -- that is an answer, not an error.
`;

// Flags whose value must survive EXACTLY as typed. Everything else is lowercased for convenience,
// which is fine for a method name and wrong for a value the device hashes: `--appid=TEST` lowercased
// derives a different entry_key than the same entry written any other way, and nothing would say so.
const VERBATIM_FLAGS = ['params', 'appid', 'ident', 'value', 'entry', 'target'];
// --compact takes no value, so it needs no place in VERBATIM_FLAGS above.

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
                add(k, VERBATIM_FLAGS.includes(k) ? v : v.toLowerCase());
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
