// Rebuild the source inventory exports without dependencies or application execution.
import { closeSync, openSync, readSync } from 'node:fs';
import * as nodePath from 'node:path';

import { AXES, attachAssessments, withoutDerivedLinks } from './coverage.ts';
import { buildExplorer } from './explorer.ts';
import {
    FEATURE_MAP_DIR,
    PyFloat,
    PyKeyError,
    REPO_ROOT,
    dumpJson,
    fnmatch,
    git,
    hasKey,
    isMain,
    isPlainObject,
    pyAssert,
    pyConcat,
    pyCount,
    pyCounter,
    pyDeepCopy,
    pyDict,
    pyDigest,
    pyEntries,
    pyEquals,
    pyExists,
    pyFindall,
    pyFinditer,
    pyGlob,
    pyHtmlEscape,
    pyIsAbsolute,
    pyIsFile,
    pyIsRelativeTo,
    pyJoin,
    pyJsonDumps,
    pyKeys,
    pyLstrip,
    pyMapIter,
    pyParent,
    pyParseNoArgs,
    pyPathName,
    pyPathParts,
    pyPathStr,
    pyPathValue,
    pyPop,
    pyRe,
    pyReEscape,
    pyRelativeTo,
    pyResolve,
    pyRglob,
    pyRstrip,
    pySearch,
    pySetKey,
    pySorted,
    pySortedPaths,
    pySplitWhitespace,
    pyStem,
    pyStr,
    pyStrJoin,
    pyStrip,
    pySuffix,
    readJson,
    readText,
    sha256File,
    splitlines,
    unique,
    writeCsv,
    writeText,
    xmlElement,
    xmlIndent,
    xmlRegisterNamespace,
    xmlSubElement,
    xmlWrite,
} from './pylib.ts';
import type { Json, JsonObject } from './pylib.ts';

const DESCRIPTION =
    'Rebuild the source inventory exports without dependencies or application execution.';

export const HERE = FEATURE_MAP_DIR;
export const REPO = REPO_ROOT;
export const PART_NAMES = ['administration', 'wallet', 'services', 'mobile'] as const;
export const PLATFORMS = ['desktop', 'web', 'mobile'] as const;
export const STATUSES = new Set<Json>(['yes', 'conditional', 'no', 'unknown']);
export const RUNTIME_STATUSES = new Set<Json>(['observed', 'blocked', 'not-reached']);
const LEVELS: ReadonlySet<Json> = new Set(['area', 'feature', 'intent']);
export const RUNTIME_FEATURE_FIELDS = new Set<string>([
    'runtime_observations',
    'screenshots',
    'runtime_order',
    'current_is_leaf',
    'runtime_errata',
    'test_coverage',
]);
export const PAGE_FEATURES: Record<string, string> = {
    ConnectPopupPage: 'connect',
    DashboardPage: 'wallet.portfolio',
    DesktopSettingsGeneralPage: 'app-settings',
    WebSettingsGeneralPage: 'app-settings',
    EarnPage: 'earn',
    EarnClaimPage: 'earn.yield.claim',
    EarnDepositPage: 'earn.yield.deposit',
    EarnUnwrapPage: 'earn.yield.standalone-unwrap',
    EarnWithdrawPage: 'earn.yield.withdraw',
    EarnWrapPage: 'earn.yield.standalone-wrap',
    EarnTronClaimPage: 'earn.staking.trx.claim',
    EarnTronRedirectPage: 'earn.staking.trx',
    EarnTronStakePage: 'earn.staking.trx.freeze',
    EarnTronUnstakePage: 'earn.staking.trx.unfreeze',
    EarnTronVotePage: 'earn.staking.trx.vote',
    EarnTronWithdrawPage: 'earn.staking.trx.withdraw',
    HiddenTokensPage: 'wallet.portfolio.hidden-assets',
    NftsPage: 'wallet.nfts',
    NotificationPage: 'help.activity',
    PasswordManagerPage: 'labeling.password-manager',
    ReceivePage: 'wallet.receive',
    ReferAFriendPage: 'help.referral.prototype',
    SettingsCoinsPage: 'network-settings',
    SettingsConnectedAppsPage: 'connect',
    SettingsDevicePage: 'device-settings',
    SignVerifyPage: 'wallet.sign-verify',
    TokensPage: 'wallet.tokens',
    TradingBuyConfirmPage: 'trade.buy.provider-checkout',
    TradingBuyDetailPage: 'trade.buy.payment-status',
    TradingBuyFormPage: 'trade.buy',
    TradingConciergeDetailPage: 'trade.concierge',
    TradingExchangeApprovalPage: 'trade.swap.approval',
    TradingExchangeConfirmPage: 'trade.swap.clear-signing',
    TradingExchangeDetailPage: 'trade.swap.status',
    TradingExchangeFormPage: 'trade.swap',
    TradingRedirectPage: 'trade',
    TradingSellConfirmPage: 'trade.sell.confirm-send',
    TradingSellDetailPage: 'trade.sell.status',
    TradingSellFormPage: 'trade.sell',
    TradingTransactionsPage: 'trade.history',
    TransactionsPage: 'wallet.transactions',
    WalletAnonymizePage: 'wallet.coinjoin',
    WalletCoinjoinPage: 'wallet.coinjoin',
    WalletDetailsPage: 'wallet.accounts.details',
    WalletSendPage: 'wallet.send',
    WalletStakingPage: 'earn.staking',
};
export const RELATED_FEATURES: Record<string, string[]> = {
    'app-settings.language': ['device-settings.language'],
    'onboarding.new-wallet': [
        'device-settings.backup.create-backup',
        'device-settings.check-backup',
    ],
    'onboarding.new-wallet.nfc': ['device-settings.backup.additional-nfc'],
    'onboarding.pin': ['device-settings.pin', 'connection.pin-unlock'],
    'wallet-access.hidden': ['device-settings.passphrase'],
    'wallet-access.rename': ['labeling.suite-sync', 'labeling.legacy'],
    'wallet.accounts.rename': ['labeling.suite-sync'],
    'wallet.receive.label': ['labeling.suite-sync'],
    'wallet.transactions.labels': ['labeling.suite-sync'],
    'wallet.accounts.labels': ['labeling.suite-sync', 'labeling.legacy'],
    'connection.payment-uri': ['wallet.send.form'],
    'connect.walletconnect.transaction': ['wallet.send.review'],
    'mobile.send.destination-tag': [
        'wallet.send.advanced.xrp-tag',
        'wallet.send.advanced.stellar-memo',
    ],
    'mobile.send.fee.eip1559': ['wallet.send.fees.max-fee', 'wallet.send.fees.priority-fee'],
    'mobile.earn.staking.stake': ['earn.staking.eth.deposit', 'earn.staking.sol.stake'],
    'mobile.earn.staking.unstake': ['earn.staking.eth.unstake', 'earn.staking.sol.unstake'],
    'mobile.earn.staking.claim': ['earn.staking.eth.claim', 'earn.staking.sol.claim'],
    'mobile.earn.staking.view-only': ['earn.staking.ada', 'earn.staking.trx'],
    'mobile.settings.trading-residence': ['trade.buy.country', 'trade.sell.residence'],
};

// ---------------------------------------------------------------------------
// Python dict/list access helpers (d[k] raises KeyError, d.get(k, default), truthiness)
// ---------------------------------------------------------------------------

type Obj = JsonObject;

const typeName = (value: unknown): string => {
    if (value === null || value === undefined) return 'NoneType';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'string') return 'str';

    return typeof value;
};

/** d[key] for a dict: raises KeyError when missing, TypeError when d is not a dict. */
const at = (container: Json | undefined, key: string): Json => {
    if (!isPlainObject(container))
        throw new TypeError(
            `'${typeName(container)}' object is not subscriptable by ${pyStr(key)}`,
        );
    if (!hasKey(container, key)) throw new PyKeyError(key);

    return container[key];
};
const atObj = (container: Json | undefined, key: string): Obj => at(container, key) as Obj;
const atArr = (container: Json | undefined, key: string): Json[] => at(container, key) as Json[];
const atStr = (container: Json | undefined, key: string): string => at(container, key) as string;
const atObjs = (container: Json | undefined, key: string): Obj[] => at(container, key) as Obj[];

/** d.get(key, default): keys that are not strings never match a JSON dict key. */
const get = (container: Obj, key: Json | undefined, fallback: Json = null): Json =>
    typeof key === 'string' && hasKey(container, key) ? container[key] : fallback;

/** by_id[key] on a dict built in Python: KeyError when missing. */
const mapGet = <K, V>(map: Map<K, V>, key: K): V => {
    if (!map.has(key)) throw new PyKeyError(key);

    return map.get(key) as V;
};

/** defaultdict(factory)[key] */
const defaultGet = <K, V>(map: Map<K, V>, key: K, factory: () => V): V => {
    let value = map.get(key);
    if (value === undefined && !map.has(key)) {
        value = factory();
        map.set(key, value);
    }

    return value as V;
};

/** dict.setdefault(key, default) */
const setdefault = (container: Obj, key: string, fallback: Json): Json => {
    if (hasKey(container, key)) return container[key];
    pySetKey(container, key, fallback);

    return fallback;
};

/** bool(value) */
const truthy = (value: unknown): boolean => {
    if (value === null || value === undefined || value === false) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'bigint') return value !== 0n;
    if (typeof value === 'string') return value.length > 0;
    if (value instanceof PyFloat) return value.value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Map || value instanceof Set) return value.size > 0;
    if (isPlainObject(value)) return pyKeys(value).length > 0;

    return true;
};

/** set(items).issubset(container) */
const isSubset = (items: Iterable<Json>, container: { has: (item: Json) => boolean }): boolean => {
    for (const item of items) if (!container.has(item)) return false;

    return true;
};

/** Key a Counter entry the way json.dumps renders a dict key. */
const counterKey = (key: Json): string => {
    if (typeof key === 'string') return key;
    if (key === null) return 'null';
    if (key === true) return 'true';
    if (key === false) return 'false';

    return pyStr(key);
};

/** dict(Counter(items)) */
const counterDict = (items: Iterable<Json>): Obj =>
    pyDict(
        [...pyCounter([...items].map(item => item as string)).entries()].map(
            ([key, count]) => [counterKey(key), count] as const,
        ),
    );

/** sum(bool(x) for x in items) */
const countTrue = (items: Iterable<unknown>): number => {
    let total = 0;
    for (const item of items) if (truthy(item)) total++;

    return total;
};

const unsafePath = (path: string): boolean =>
    pyIsAbsolute(path) || pyPathParts(path).includes('..');

// ---------------------------------------------------------------------------
// Shared build helpers
// ---------------------------------------------------------------------------

const dump = (name: string, value: unknown): void => dumpJson(pyJoin(HERE, name), value);

export const readParts = (): Obj => {
    const parts: Obj = {};
    for (const name of PART_NAMES)
        pySetKey(parts, name, readJson(pyJoin(HERE, 'parts', name + '.json')));

    return parts;
};

export const readRuntime = (): Obj => {
    const path = pyJoin(HERE, 'parts/runtime-observations.json');
    if (!pyExists(path)) return { observations: [], screenshots: [], new_features: [] };
    const value = readJson(path) as Obj;
    for (const key of ['observations', 'screenshots', 'new_features']) {
        pyAssert(Array.isArray(get(value, key)), ['Runtime manifest needs an array', key]);
    }
    pyAssert(Array.isArray(get(value, 'errata', [])), 'Runtime errata must be an array');
    // Later captures go to a supplement so the pinned manifest stays byte-identical.
    const supplementPath = pyJoin(HERE, 'parts/runtime-supplement.json');
    if (pyExists(supplementPath)) {
        const supplement = readJson(supplementPath) as Obj;
        for (const key of ['observations', 'screenshots']) {
            const extra = get(supplement, key, []);
            pyAssert(Array.isArray(extra), ['Runtime supplement needs an array', key]);
            value[key] = [...atArr(value, key), ...(extra as Json[])];
        }
    }

    return value;
};

/** Source-reviewed features added after the runtime pass, kept outside the pinned runtime manifest. */
export const readSourceAdditions = (): Obj[] => {
    const path = pyJoin(HERE, 'parts/source-additions.json');
    if (!pyExists(path)) return [];
    const value = readJson(path) as Obj;
    pyAssert(
        Array.isArray(get(value, 'new_features')),
        'Source additions need a new_features array',
    );

    return atObjs(value, 'new_features');
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Returns the resolved absolute screenshot path (Python returns a Path). */
export const screenshotFile = (capture: Obj): string => {
    const raw = atStr(capture, 'path');
    const path = pyPathStr(raw);
    const shown = pyPathValue(raw);
    pyAssert(!unsafePath(path), ['Unsafe screenshot path', shown]);
    const parts = pyPathParts(path);
    const full = pyResolve(
        parts.length && parts[0] === 'runtime' ? pyJoin(HERE, path) : pyJoin(REPO, path),
    );
    pyAssert(pyIsRelativeTo(full, pyResolve(pyJoin(HERE, 'runtime/screenshots'))), [
        'Screenshot outside runtime capture directory',
        shown,
    ]);
    pyAssert(pySuffix(full).toLowerCase() === '.png' && pyIsFile(full), [
        'Missing PNG screenshot',
        shown,
    ]);
    const head = Buffer.alloc(8);
    const fd = openSync(full, 'r');
    let read: number;
    try {
        read = readSync(fd, head, 0, 8, 0);
    } finally {
        closeSync(fd);
    }
    pyAssert(head.subarray(0, read).equals(PNG_SIGNATURE), ['Invalid PNG signature', shown]);

    return full;
};

// Ownership is curated through parts/team-ownership.json, so baselines do not pin it.
export const OWNERSHIP_FIELDS = new Set<string>(['ownership']);

/** Feature fields protected by a baseline hash: everything except the excluded and ownership fields. */
export const baselineView = (feature: Obj, excluded: ReadonlySet<string>): Obj => {
    const view = pyDict(
        pyEntries(feature).filter(([key]) => !excluded.has(key) && !OWNERSHIP_FIELDS.has(key)),
    );
    if (hasKey(view, 'variants')) {
        view.variants = atObjs(view, 'variants').map(v =>
            pyDict(pyEntries(v).filter(([key]) => key !== 'ownership')),
        );
    }

    return view;
};

export const applyTeamOwnership = (features: Obj[]): Obj[] => {
    const config = readJson(pyJoin(HERE, 'parts/team-ownership.json')) as Obj;
    const teams = new Set<Json>(atArr(config, 'teams'));
    const aliases = atObj(config, 'team_aliases');
    const changes = atObj(config, 'agreed_team_changes');
    const overrides = atObj(config, 'feature_teams');
    const byId = new Map<Json, Obj>();
    for (const f of features) byId.set(at(f, 'id'), f);
    const overrideIds = pyKeys(overrides);
    pyAssert(isSubset(overrideIds, byId), [
        'Team override for an unknown feature',
        new Set(overrideIds.filter(id => !byId.has(id))),
    ]);
    const backendAssignments = new Map<Json, Obj>();
    for (const assignment of atObjs(config, 'backend_team_assignments')) {
        pyAssert(teams.has(at(assignment, 'team')), ['Unknown backend team', assignment.team]);
        for (const featureId of atArr(assignment, 'feature_ids')) {
            pyAssert(byId.has(featureId), ['Backend team for an unknown feature', featureId]);
            pyAssert(!backendAssignments.has(featureId), ['Duplicate backend team', featureId]);
            backendAssignments.set(featureId, assignment);
        }
    }
    for (const f of features) {
        const ownership = pyDeepCopy(atObj(f, 'ownership'));
        const raw = at(ownership, 'team');
        const id = at(f, 'id');
        if (typeof id === 'string' && hasKey(overrides, id)) {
            const override = atObj(overrides, id);
            ownership.team = at(override, 'team');
            ownership.confidence = 'agreed';
            ownership.basis = at(atObj(overrides, id), 'basis');
        } else if (typeof raw === 'string' && hasKey(changes, raw)) {
            ownership.team = at(atObj(changes, raw), 'team');
            ownership.confidence = 'agreed';
            ownership.basis = at(atObj(changes, raw), 'basis');
        } else {
            ownership.team = get(aliases, raw, raw);
        }
        pyAssert(teams.has(ownership.team), ['Feature has no canonical team', id, raw]);
        // The frontend team owns the backend too unless an assignment splits them.
        const backend = backendAssignments.get(id);
        ownership.backend_team = backend ? at(backend, 'team') : ownership.team;
        ownership.backend_basis = backend ? at(backend, 'basis') : null;
        f.ownership = ownership;
        for (const v of get(f, 'variants', []) as Obj[]) pyPop(v, 'ownership', null);
    }

    return features;
};

export const checkAdditiveBaseline = (features: Obj[]): Obj => {
    const path = pyJoin(HERE, 'runtime/baseline.json');
    if (!pyExists(path)) return { status: 'not-available', baseline_features: 0 };
    const baseline = readJson(path) as Obj;
    const byId = new Map<Json, Obj>();
    for (const feature of features) byId.set(at(feature, 'id'), feature);
    pyAssert(isSubset(atArr(baseline, 'feature_ids'), byId), 'Baseline feature IDs were removed');
    for (const [featureId, expected] of pyEntries(atObj(baseline, 'feature_hashes'))) {
        const original = baselineView(mapGet(byId, featureId), RUNTIME_FEATURE_FIELDS);
        const actual = pyDigest(withoutDerivedLinks(original));
        pyAssert(pyEquals(actual, expected), ['Original feature fields changed', featureId]);
    }
    for (const [featureId, originalPath] of pyEntries(
        get(baseline, 'screenshot_paths', {}) as Obj,
    )) {
        pyAssert(pyEquals(at(atObj(mapGet(byId, featureId), 'screenshot'), 'path'), originalPath), [
            'Original screenshot changed',
            featureId,
        ]);
    }

    return {
        status: 'pass',
        baseline_features: atArr(baseline, 'feature_ids').length,
        source_commit: at(baseline, 'source_commit'),
    };
};

const navigationAlternatives = (f: Obj): Obj => {
    const result: Obj = {};
    for (const p of PLATFORMS) {
        const value = at(atObj(f, 'navigation'), p);
        result[p] = truthy(value) && at(atObj(f, 'platforms'), p) !== 'no' ? [value] : [];
    }

    return result;
};

/** Desktop/web page components live in the suite-app feature modules (suite-app/<module>/src/pages). */
const pagePath = (component: string): string => {
    const matches = splitlines(git('ls-files', `suite-app/*/src/pages/${component}.tsx`));
    pyAssert(matches.length === 1, ['Page component not found exactly once', component]);

    return matches[0];
};

export const variant = (feature: Obj, platform: string): Obj => ({
    source_id: at(feature, 'id'),
    platform,
    name: at(feature, 'name'),
    description: at(feature, 'description'),
    navigation: at(feature, 'navigation'),
    conditions: at(feature, 'conditions'),
    platform_notes: at(feature, 'platform_notes'),
    ownership: at(feature, 'ownership'),
});

const automatedAuditPaths = (): string[] =>
    pySortedPaths(pyGlob(pyJoin(HERE, 'parts'), '*-automated-audit.json'));

export const collectFeatures = (parts: Obj, reconciliation: Obj): Obj[] => {
    const features: Obj[] = [];
    for (const name of PART_NAMES.slice(0, -1)) {
        for (const original of atObjs(atObj(parts, name), 'features')) {
            const f = pyDeepCopy(original);
            f.source_ids = [at(f, 'id')];
            f.variants = [variant(original, 'desktop-web')];
            features.push(f);
        }
    }
    const byId = new Map<Json, Obj>();
    for (const f of features) byId.set(at(f, 'id'), f);
    const app = pyDeepCopy(mapGet(byId, 'onboarding.analytics'));
    app.id = 'app-onboarding';
    app.parent_id = null;
    app.name = 'Application onboarding';
    app.description =
        'Choose initial application preferences before connecting or tracking a wallet.';
    app.level = 'area';
    app.source_ids = [];
    app.variants = [];
    app.related_ids = [];
    app.navigation = { desktop: 'First launch', web: 'First launch', mobile: null };
    app.screenshot = {
        status: 'not-captured',
        path: null,
        notes: 'No current screenshot captured.',
    };
    features.unshift(app);
    byId.set(at(app, 'id'), app);
    mapGet(byId, 'onboarding.analytics').parent_id = 'app-onboarding';
    const eq = atObj(reconciliation, 'equivalences');
    const mobileFeatures = atObjs(atObj(parts, 'mobile'), 'features');
    const mobileIds = new Set<Json>(mobileFeatures.map(f => at(f, 'id')));
    for (const [source, target] of pyEntries(eq)) {
        pyAssert(mobileIds.has(source), ['Unknown source equivalence', source]);
        pyAssert(byId.has(target), ['Unknown canonical target', target]);
    }
    for (const original of mobileFeatures) {
        const sourceId = at(original, 'id');
        if (typeof sourceId === 'string' && hasKey(eq, sourceId)) {
            const f = mapGet(byId, eq[sourceId]);
            atArr(f, 'source_ids').push(sourceId);
            atArr(f, 'variants').push(variant(original, 'mobile'));
            atObj(f, 'platforms').mobile = at(atObj(original, 'platforms'), 'mobile');
            if (!truthy(at(atObj(f, 'navigation'), 'mobile'))) {
                atObj(f, 'navigation').mobile = at(atObj(original, 'navigation'), 'mobile');
            }
            for (const key of ['roots', 'evidence', 'related_ids']) {
                f[key] = unique([...atArr(f, key), ...pyDeepCopy(atArr(original, key))]);
            }
        } else {
            const f = pyDeepCopy(original);
            f.source_ids = [sourceId];
            f.variants = [variant(original, 'mobile')];
            f.parent_id = get(eq, at(f, 'parent_id'), f.parent_id);
            features.push(f);
            byId.set(at(f, 'id'), f);
        }
    }
    for (const name of ['administration', 'wallet', 'services']) {
        const path = pyJoin(HERE, 'parts', name + '-parity.json');
        if (!pyExists(path)) continue;
        for (const update of atObjs(readJson(path), 'updates')) {
            const f = mapGet(byId, at(update, 'id'));
            let status = at(update, 'mobile_status');
            pyAssert(STATUSES.has(status));
            const platforms = atObj(f, 'platforms');
            const current = at(platforms, 'mobile');
            if (current !== 'unknown' && !pyEquals(current, status)) {
                if (
                    (current === 'yes' || current === 'conditional') &&
                    (status === 'yes' || status === 'conditional')
                ) {
                    status = 'conditional';
                } else {
                    throw new Error('ValueError: Conflicting platform audit for ' + atStr(f, 'id'));
                }
            }
            platforms.mobile = status;
            atObj(f, 'navigation').mobile = status !== 'no' ? get(update, 'navigation') : null;
            f.evidence = unique([
                ...atArr(f, 'evidence'),
                ...(get(update, 'evidence', []) as Json[]),
            ]);
            if (status === 'yes' || status === 'conditional') {
                f.roots = unique([...atArr(f, 'roots'), ...(get(update, 'roots', []) as Json[])]);
            }
            (setdefault(f, 'parity_audit', []) as Json[]).push({
                platform: 'mobile',
                status,
                reason: at(update, 'reason'),
                evidence_paths: (get(update, 'evidence', []) as Obj[]).map(e => at(e, 'path')),
            });
        }
    }
    const reciprocalPath = pyJoin(HERE, 'parts/native-desktop-parity.json');
    if (pyExists(reciprocalPath)) {
        const reciprocal = readJson(reciprocalPath) as Obj;
        for (const update of atObjs(reciprocal, 'updates')) {
            const updateId = at(update, 'id');
            if (
                truthy(get(update, 'equivalent_id')) ||
                (typeof updateId === 'string' && hasKey(eq, updateId))
            )
                continue;
            const f = mapGet(byId, updateId);
            for (const platform of ['desktop', 'web']) {
                const status = at(update, platform + '_status');
                atObj(f, 'platforms')[platform] = status;
                atObj(f, 'navigation')[platform] =
                    status !== 'no' ? at(atObj(update, 'navigation'), platform) : null;
                (setdefault(f, 'parity_audit', []) as Json[]).push({
                    platform,
                    status,
                    reason: at(update, 'reason'),
                    evidence_paths: atObjs(update, 'evidence').map(e => at(e, 'path')),
                });
            }
            f.evidence = unique([...atArr(f, 'evidence'), ...atArr(update, 'evidence')]);
            if (
                ['desktop', 'web'].some(p =>
                    ['yes', 'conditional'].includes(at(atObj(f, 'platforms'), p) as string),
                )
            ) {
                f.roots = unique([...atArr(f, 'roots'), ...(get(update, 'roots', []) as Json[])]);
            }
        }
        for (const update of get(reciprocal, 'extra_mobile_updates', []) as Obj[]) {
            const f = mapGet(byId, at(update, 'id'));
            atObj(f, 'platforms').mobile = at(update, 'mobile_status');
            atObj(f, 'navigation').mobile = get(update, 'navigation');
            f.evidence = unique([
                ...atArr(f, 'evidence'),
                ...(get(update, 'evidence', []) as Json[]),
            ]);
            (setdefault(f, 'parity_audit', []) as Json[]).push({
                platform: 'mobile',
                status: at(update, 'mobile_status'),
                reason: at(update, 'reason'),
                evidence_paths: (get(update, 'evidence', []) as Obj[]).map(e => at(e, 'path')),
            });
        }
    }
    for (const path of automatedAuditPaths()) {
        for (const source of atObjs(readJson(path), 'sources')) {
            for (const featureId of atArr(source, 'feature_ids')) {
                const f = mapGet(byId, featureId);
                // Python evaluates the get() default eagerly, so "reason" is required even when "detail" exists.
                const sourcePath = at(source, 'path');
                const reason = at(source, 'reason');
                f.evidence = unique([
                    ...atArr(f, 'evidence'),
                    {
                        kind: 'automated-test',
                        path: sourcePath,
                        detail: get(source, 'detail', reason),
                    },
                ]);
            }
        }
    }
    for (const [component, featureId] of Object.entries(PAGE_FEATURES)) {
        const path = pagePath(component);
        const f = mapGet(byId, featureId);
        let root = atObjs(f, 'roots').find(r => at(r, 'path') === path) ?? null;
        if (root === null) {
            root = { platform: 'desktop-web', path, symbol: component };
            atArr(f, 'roots').unshift(root);
        }
        root.role = 'screen-entry';
        if (component.startsWith('Desktop')) {
            root.supported_platforms = ['desktop'];
        } else if (component.startsWith('Web')) {
            root.supported_platforms = ['web'];
        }
        f.evidence = unique([
            ...atArr(f, 'evidence'),
            {
                kind: 'route',
                path,
                detail: 'Application page wrapper selected by desktopComponents/webComponents; child controls remain linked separately.',
            },
        ]);
    }
    // Scope flags remain explicit even when an internal/prototype node is retained as context.
    const internal = new Set<Json>(['help.referral.prototype', 'mobile.earn.wrap']);
    for (const f of features) {
        const id = at(f, 'id');
        const extra =
            typeof id === 'string' && Object.hasOwn(RELATED_FEATURES, id)
                ? RELATED_FEATURES[id]
                : [];
        atArr(f, 'related_ids').push(...extra);
        f.scope = internal.has(id) ? 'internal-reference' : 'user-facing';
        const conditionsByPlatform = new Map<string, Json[]>();
        f.conditions_by_platform = {};
        for (const v of atObjs(f, 'variants')) {
            defaultGet(conditionsByPlatform, atStr(v, 'platform'), () => []).push(
                ...atArr(v, 'conditions'),
            );
        }
        for (const audit of get(f, 'parity_audit', []) as Obj[]) {
            defaultGet(conditionsByPlatform, atStr(audit, 'platform'), () => []).push(
                at(audit, 'reason'),
            );
        }
        const conditionEntries = [...conditionsByPlatform.entries()].map(
            ([p, values]) => [p, unique(values)] as const,
        );
        f.conditions_by_platform = pyDict(conditionEntries);
        f.conditions = conditionEntries.flatMap(([p, values]) =>
            values.map(value => pyConcat(p, ': ', value)),
        );
        f.platform_notes = PLATFORMS.map(p => pyConcat(p, ': ', at(atObj(f, 'platforms'), p))).join(
            '; ',
        );
        const alternatives: Obj = {};
        for (const p of PLATFORMS) {
            alternatives[p] =
                at(atObj(f, 'platforms'), p) !== 'no'
                    ? unique(
                          [
                              at(atObj(f, 'navigation'), p),
                              ...atObjs(f, 'variants').map(v => at(atObj(v, 'navigation'), p)),
                          ].filter(value => truthy(value)),
                      )
                    : [];
        }
        f.navigation_alternatives = alternatives;
        f.related_ids = unique(atArr(f, 'related_ids').map(i => get(eq, i, i)));
        f.related_ids = atArr(f, 'related_ids').filter(i => !pyEquals(i, f.id) && byId.has(i));
    }

    return features;
};

type CodeownersEntry = [string, string[], number];

export const enrich = (features: Obj[], snapshot: string): [Obj[], string] => {
    void snapshot;
    const base = git('merge-base', 'HEAD', 'origin/develop');
    const changed = new Set(splitlines(git('diff', '--name-only', base, '--')));
    const tracked = new Set(splitlines(git('ls-files')));
    const codeowners: CodeownersEntry[] = [];
    splitlines(readText(pyJoin(REPO, 'CODEOWNERS'))).forEach((line, index) => {
        if (truthy(pyStrip(line)) && !line.startsWith('#')) {
            const [pattern, ...owners] = pySplitWhitespace(line);
            codeowners.push([pattern, owners, index + 1]);
        }
    });
    const content = new Map<string, string>();
    const exportNames = pyRe('export\\s+(?:const|function|class)\\s+(\\w+)');

    const reference = (ref: Obj, root = false): Obj => {
        const path = atStr(ref, 'path');
        pyAssert(!unsafePath(path), path);
        pyAssert(pyIsFile(pyJoin(REPO, path)), path);
        // setdefault evaluates its default eagerly, so the file is read on every call.
        const fresh = readText(pyJoin(REPO, path), { errors: 'replace' });
        if (!content.has(path)) content.set(path, fresh);
        const text = content.get(path) as string;
        let symbol = get(ref, 'symbol');
        if (root && !truthy(symbol)) {
            const stem = pyStem(path);
            const names = pyFindall(exportNames, text) as string[];
            if (names.includes(stem)) {
                symbol = stem;
            } else if (names.length === 1) {
                symbol = names[0];
            }
            ref.symbol = symbol;
        }
        let lineNumber = 1;
        if (truthy(symbol)) {
            const escaped = pyReEscape(symbol as string);
            const pattern = pyRe(
                '(?:export\\s+(?:default\\s+)?(?:const|function|class)\\s+|(?:const|function|class)\\s+)' +
                    escaped +
                    '\\b',
            );
            const found = pySearch(pattern, text);
            if (found) {
                lineNumber = pyCount(text, '\n', 0, found.index) + 1;
            } else if (!pySearch(pyRe('\\b' + escaped + '\\b'), text)) {
                ref.symbol_note = 'Supplied symbol not found; containing file is the reference.';
                ref.symbol = null;
            }
        }
        // A reviewed line beats the symbol definition; keep it while it is inside the file.
        const supplied = get(ref, 'line');
        if (typeof supplied === 'number' && Number.isInteger(supplied) && supplied >= 1) {
            if (supplied <= pyCount(text, '\n') + 1) {
                lineNumber = supplied;
            } else {
                ref.line_note = `Supplied line ${supplied} is past the end of the file; using ${lineNumber}.`;
            }
        }
        ref.line = lineNumber;
        ref.local_link = path + ':' + String(lineNumber);
        ref.repository_link = '../../../' + path + '#L' + String(lineNumber);
        // Only link a published ancestor when its file is identical to the audited file.
        ref.github_url =
            tracked.has(path) && !changed.has(path)
                ? 'https://github.com/trezor/trezor-suite/blob/' +
                  base +
                  '/' +
                  path +
                  '#L' +
                  String(lineNumber)
                : null;
        if (root) {
            let ownerMatch: Obj | null = null;
            for (const [pattern, owners, ownerLine] of codeowners) {
                const prefix = pyRstrip(pyLstrip(pattern, '/'), '/');
                if (path === prefix || path.startsWith(prefix + '/') || fnmatch(path, prefix)) {
                    ownerMatch = { owners, pattern, line: ownerLine };
                }
            }
            ref.codeowners = ownerMatch;
            setdefault(ref, 'role', 'entry-or-containing-component');
        }

        return ref;
    };

    const byId = new Map<Json, Obj>();
    for (const f of features) byId.set(at(f, 'id'), f);
    pyAssert(byId.size === features.length, 'Duplicate IDs');
    const children = new Map<Json, Obj[]>();
    for (const f of features) {
        const parentId = at(f, 'parent_id');
        pyAssert(parentId === null || byId.has(parentId), f.id);
        defaultGet(children, parentId, () => []).push(f);
        f.roots = atObjs(f, 'roots').map(r => reference(r, true));
        f.evidence = atObjs(f, 'evidence').map(e => reference(e));
        pyAssert(
            atObjs(f, 'evidence').some(e => at(e, 'kind') === 'implementation'),
            f.id,
        );
        for (const source of get(atObj(f, 'ownership'), 'source_paths', []) as string[]) {
            pyAssert(pyIsFile(pyJoin(REPO, source)), source);
        }
        const screenshot = atObj(f, 'screenshot');
        if (truthy(at(screenshot, 'path'))) {
            pyAssert(pyIsFile(pyJoin(REPO, atStr(screenshot, 'path'))));
            screenshot.local_link = atStr(screenshot, 'path');
        }
        for (const p of PLATFORMS) {
            pyAssert(STATUSES.has(at(atObj(f, 'platforms'), p)));
            if (at(atObj(f, 'platforms'), p) === 'no') atObj(f, 'navigation')[p] = null;
        }
    }
    const ordered: Obj[] = [];

    const visit = (f: Obj, ancestry: Json[]): void => {
        pyAssert(!ancestry.includes(at(f, 'id')), 'Hierarchy cycle');
        const ids = [...ancestry, f.id];
        f.depth = ancestry.length;
        f.path_ids = ids;
        f.breadcrumb = pyStrJoin(
            ' > ',
            pyMapIter(ids, i => at(mapGet(byId, i), 'name')),
        );
        f.order = ordered.length;
        f.is_leaf = !truthy(defaultGet(children, f.id, () => []));
        ordered.push(f);
        for (const child of defaultGet(children, f.id, () => [])) visit(child, ids);
    };
    for (const root of defaultGet(children, null, () => [])) visit(root, []);
    pyAssert(ordered.length === features.length, 'Unreachable/cyclic nodes');

    return [ordered, base];
};

export const addRuntime = (
    features: Obj[],
    runtime: Obj,
    snapshot: string,
    sourceAdditions: readonly Obj[] = [],
): [Obj[], Obj, Obj] => {
    const staticById = new Map<Json, Obj>();
    for (const feature of features) staticById.set(at(feature, 'id'), pyDeepCopy(feature));
    const additions: Obj[] = [];
    for (const original of atObjs(runtime, 'new_features')) {
        pyAssert(!staticById.has(at(original, 'id')), [
            'Runtime addition reuses an existing feature ID',
            original.id,
        ]);
        const f = pyDeepCopy(original);
        const roots = atObjs(f, 'roots');
        // Typed for the dict key; pyConcat still rejects a non-str platform as Python does.
        const platform = (truthy(roots) ? at(roots[0], 'platform') : 'shared') as string;
        f.source_ids = [at(f, 'id')];
        f.variants = [variant(original, platform)];
        f.scope = get(f, 'scope', 'user-facing');
        f.conditions_by_platform = pyDict([[platform, [...atArr(original, 'conditions')]]]);
        f.conditions = atArr(original, 'conditions').map(value => pyConcat(platform, ': ', value));
        f.navigation_alternatives = navigationAlternatives(f);
        f.runtime_added = true;
        additions.push(f);
    }
    const runtimeAdditions = [...additions];
    // Appended after runtime additions so that existing feature order and baseline hashes stay unchanged.
    for (const original of sourceAdditions) {
        const id = at(original, 'id');
        pyAssert(!staticById.has(id) && additions.every(a => !pyEquals(id, at(a, 'id'))), [
            'Source addition reuses an existing feature ID',
            id,
        ]);
        const f = pyDeepCopy(original);
        let platforms = unique(atObjs(f, 'roots').map(r => at(r, 'platform')));
        if (!platforms.length) platforms = ['shared'];
        f.source_ids = [at(f, 'id')];
        f.variants = [variant(original, platforms[0] as string)];
        f.scope = get(f, 'scope', 'user-facing');
        f.conditions_by_platform = { shared: [...atArr(original, 'conditions')] };
        f.conditions = atArr(original, 'conditions').map(value => pyConcat('shared: ', value));
        f.navigation_alternatives = navigationAlternatives(f);
        f.source_added = true;
        additions.push(f);
    }
    const enriched = additions.length ? enrich([...features, ...additions], snapshot)[0] : features;
    const addedOrder = new Map<Json, number>();
    additions.forEach((feature, index) =>
        addedOrder.set(at(feature, 'id'), staticById.size + index),
    );
    const output: Obj[] = [];
    for (const current of enriched) {
        const currentId = at(current, 'id');
        const f = pyDeepCopy(
            staticById.has(currentId) ? (staticById.get(currentId) as Obj) : current,
        );
        f.runtime_order = at(current, 'order');
        f.current_is_leaf = at(current, 'is_leaf');
        const fId = at(f, 'id');
        if (addedOrder.has(fId)) f.order = addedOrder.get(fId) as number;
        f.runtime_observations = [];
        f.screenshots = [];
        f.runtime_errata = [];
        output.push(f);
    }
    const byId = new Map<Json, Obj>();
    for (const feature of output) byId.set(at(feature, 'id'), feature);
    pyAssert(byId.size === output.length, 'Duplicate runtime feature additions');
    const captures: Obj[] = [];
    const capturesById = new Map<Json, Obj>();
    const screenshotFields = [
        'id',
        'path',
        'feature_ids',
        'platform',
        'model',
        'firmware',
        'caption',
        'fixture_context',
        'captured_at',
    ];
    for (const original of atObjs(runtime, 'screenshots')) {
        pyAssert(
            screenshotFields.every(key => hasKey(original, key)),
            ['Incomplete screenshot record', get(original, 'id')],
        );
        pyAssert(!capturesById.has(at(original, 'id')), ['Duplicate screenshot ID', original.id]);
        pyAssert((PLATFORMS as readonly Json[]).includes(at(original, 'platform')));
        const featureIds = atArr(original, 'feature_ids');
        pyAssert(truthy(featureIds) && new Set(featureIds).size === featureIds.length);
        pyAssert(isSubset(featureIds, byId), [
            'Screenshot references an unknown feature',
            original.id,
        ]);
        const full = screenshotFile(original);
        const capture = pyDeepCopy(original);
        capture.repository_path = pyRelativeTo(full, REPO);
        capture.explorer_path = pyRelativeTo(full, HERE);
        capture.local_link = capture.repository_path;
        capture.sha256 = sha256File(full);
        captures.push(capture);
        capturesById.set(at(capture, 'id'), capture);
    }
    const observations: Obj[] = [];
    const observationIds = new Set<Json>();
    const observationFields = [
        'id',
        'feature_ids',
        'platform',
        'model',
        'firmware',
        'status',
        'navigation',
        'description',
        'screenshot_ids',
        'conditions',
        'date',
    ];
    for (const original of atObjs(runtime, 'observations')) {
        pyAssert(
            observationFields.every(key => hasKey(original, key)),
            ['Incomplete observation record', get(original, 'id')],
        );
        pyAssert(!observationIds.has(at(original, 'id')), [
            'Duplicate observation ID',
            original.id,
        ]);
        observationIds.add(original.id);
        pyAssert(
            (PLATFORMS as readonly Json[]).includes(at(original, 'platform')) &&
                RUNTIME_STATUSES.has(at(original, 'status')),
        );
        const featureIds = atArr(original, 'feature_ids');
        pyAssert(truthy(featureIds) && new Set(featureIds).size === featureIds.length);
        pyAssert(isSubset(featureIds, byId), [
            'Observation references an unknown feature',
            original.id,
        ]);
        for (const screenshotId of atArr(original, 'screenshot_ids')) {
            pyAssert(capturesById.has(screenshotId), [
                'Observation references an unknown screenshot',
                original.id,
                screenshotId,
            ]);
            const captureIds = new Set(atArr(mapGet(capturesById, screenshotId), 'feature_ids'));
            pyAssert(
                featureIds.some(id => captureIds.has(id)),
                ['Unrelated observation screenshot', original.id, screenshotId],
            );
        }
        const observation = pyDeepCopy(original);
        observations.push(observation);
        for (const featureId of atArr(observation, 'feature_ids')) {
            atArr(mapGet(byId, featureId), 'runtime_observations').push(pyDeepCopy(observation));
        }
    }
    const errata = pyDeepCopy(get(runtime, 'errata', []) as Obj[]);
    const observationsById = new Map<Json, Obj>();
    for (const observation of observations)
        observationsById.set(at(observation, 'id'), observation);
    const superseded = new Set<Json>();
    for (const capture of captures) {
        capture.errata = [];
        capture.effective_feature_ids = [...atArr(capture, 'feature_ids')];
    }
    const correctionFields = [
        'observation_id',
        'screenshot_id',
        'description',
        'feature_ids',
        'reason',
    ];
    for (const correction of errata) {
        pyAssert(
            correctionFields.every(key => hasKey(correction, key)),
            'Incomplete runtime erratum',
        );
        pyAssert(
            observationsById.has(at(correction, 'observation_id')),
            'Erratum references unknown observation',
        );
        pyAssert(
            capturesById.has(at(correction, 'screenshot_id')),
            'Erratum references unknown screenshot',
        );
        const observation = mapGet(observationsById, correction.observation_id);
        pyAssert(
            atArr(observation, 'screenshot_ids').some(id => pyEquals(id, correction.screenshot_id)),
            'Erratum screenshot is not part of its observation',
        );
        const description = at(correction, 'description');
        pyAssert(typeof description === 'string' && truthy(pyStrip(description)));
        const reason = at(correction, 'reason');
        pyAssert(typeof reason === 'string' && truthy(pyStrip(reason)));
        const featureIds = atArr(correction, 'feature_ids');
        pyAssert(truthy(featureIds) && new Set(featureIds).size === featureIds.length);
        pyAssert(isSubset(featureIds, byId), 'Erratum references unknown feature');
        const capture = mapGet(capturesById, correction.screenshot_id);
        atArr(capture, 'errata').push(pyDeepCopy(correction));
        capture.effective_feature_ids = [...featureIds];
        superseded.add(correction.observation_id);
        // Python iterates a set here; each feature receives one copy, so the order does not affect output.
        const touched = new Set([
            ...atArr(observation, 'feature_ids'),
            ...atArr(capture, 'feature_ids'),
            ...featureIds,
        ]);
        for (const featureId of touched)
            atArr(mapGet(byId, featureId), 'runtime_errata').push(pyDeepCopy(correction));
    }
    for (const capture of captures) {
        // Preserve original attachments and add corrected ones; the viewer labels the superseded association.
        const attachedIds = new Set([
            ...atArr(capture, 'feature_ids'),
            ...atObjs(capture, 'errata').flatMap(correction => atArr(correction, 'feature_ids')),
        ]);
        for (const featureId of attachedIds)
            atArr(mapGet(byId, featureId), 'screenshots').push(pyDeepCopy(capture));
    }
    const active = observations.filter(observation => !superseded.has(at(observation, 'id')));
    const observed = active.filter(observation => at(observation, 'status') === 'observed');
    const excludedModels = new Set(['none', 'no-device', 'not-applicable']);
    const scope: Obj = {
        source_manifest: 'parts/runtime-observations.json',
        observations: observations.length,
        statuses: counterDict(observations.map(observation => at(observation, 'status'))),
        errata: errata.length,
        superseded_observation_ids: pySorted(superseded),
        active_statuses: counterDict(active.map(observation => at(observation, 'status'))),
        observed_feature_ids: pySorted(
            new Set(observed.flatMap(observation => atArr(observation, 'feature_ids'))),
        ),
        observed_platforms: pySorted(
            new Set(observed.map(observation => at(observation, 'platform'))),
        ),
        observed_models: pySorted(
            new Set(
                observed
                    .filter(observation => {
                        const model = at(observation, 'model');

                        return (
                            truthy(model) && !excludedModels.has((model as string).toLowerCase())
                        );
                    })
                    .map(observation => observation.model),
            ),
        ),
        captured_screenshots: captures.length,
        features_with_captures: countTrue(output.map(f => at(f, 'screenshots'))),
        features_with_current_captures: new Set(
            captures.flatMap(capture => atArr(capture, 'effective_feature_ids')),
        ).size,
        new_feature_ids: runtimeAdditions.map(feature => at(feature, 'id')),
        interpretation:
            'Runtime records describe only the observed or blocked UI states under their stated model, firmware, platform and fixture conditions. Static availability, historical screenshots and source audit fields remain preserved; absence of a runtime record is not verification.',
    };
    scope.observed_features = atArr(scope, 'observed_feature_ids').length;
    // The lowest level is called "intent"; pinned inputs still spell it "option".
    for (const f of output) {
        if (at(f, 'level') === 'option') f.level = 'intent';
        pyAssert(LEVELS.has(at(f, 'level')), ['Unknown feature level', f.id, f.level]);
    }
    scope.additive_baseline = checkAdditiveBaseline(output);

    return [
        output,
        { observations, screenshots: captures, errata, new_feature_ids: scope.new_feature_ids },
        scope,
    ];
};

const sortedSet = (values: Iterable<Json> | undefined): Json[] => pySorted(values ?? []);

export const sourceAudit = (features: Obj[], parts: Obj): Obj => {
    const refs = new Map<Json, Set<Json>>();
    const refsOf = (path: Json) => defaultGet(refs, path, () => new Set<Json>());
    for (const f of features) {
        for (const e of atObjs(f, 'evidence')) refsOf(at(e, 'path')).add(at(f, 'id'));
    }
    const dispositions = new Map<Json, Obj>();
    for (const s of get(atObj(parts, 'mobile'), 'source_dispositions', []) as Obj[])
        dispositions.set(at(s, 'path'), s);
    for (const path of automatedAuditPaths()) {
        for (const source of atObjs(readJson(path), 'sources'))
            dispositions.set(at(source, 'path'), source);
    }
    const tests: Obj[] = [];
    const titlePattern = pyRe(
        '\\b(?:test|it)(?:\\.(?:skip|only|fixme))?\\(\\s*[\'\\"`]([^\'\\"`]+)',
    );
    const streamPattern = pyRe('TestStream\\.(\\w+)');
    const skippedPattern = pyRe('\\b(?:test\\.)?describe\\.skip\\s*\\(');
    for (const [root, platform] of [
        ['suite/e2e/tests', 'desktop-web'],
        ['suite-native-app/app/e2e/tests', 'mobile'],
    ]) {
        for (const p of pySortedPaths(pyRglob(pyJoin(REPO, root), '*.test.ts'))) {
            const path = pyRelativeTo(p, REPO);
            const text = readText(p);
            const manual = path.includes('/manual/');
            const titles = pyFindall(titlePattern, text);
            const d = dispositions.get(path) ?? {};
            const mapped = sortedSet(refsOf(path));
            tests.push({
                path,
                platform,
                kind: manual ? 'manual' : 'automated-e2e',
                titles: titles as Json[],
                streams: pySorted(new Set(pyFindall(streamPattern, text) as string[])),
                feature_ids: mapped,
                status: truthy(mapped) ? 'mapped' : get(d, 'status', 'unmapped'),
                reason: get(
                    d,
                    'reason',
                    truthy(mapped)
                        ? 'Linked intended scenarios; not an execution result.'
                        : 'Enumerated; individual capability mapping remains unverified.',
                ),
                declares_skipped_container: pySearch(skippedPattern, text) !== null,
            });
        }
    }
    const routeText = readText(pyJoin(REPO, 'suite/router-config/src/routeConfig.ts'));
    const routePattern = pyRe(
        "\\{\\s*name:\\s*'([^']+)',\\s*pattern:\\s*'([^']+)',\\s*app:\\s*'([^']+)'",
    );
    const routes: Obj[] = [];
    const routeGroups: Record<string, string[]> = {
        dashboard: ['wallet.portfolio'],
        'refer-a-friend': ['help.referral'],
        earn: ['earn'],
        'earn-yield': ['earn.yield'],
        'earn-staking': ['earn.staking'],
        version: [],
        bridge: ['connection.bridge'],
        'bridge-requested': ['connection.bridge'],
        'bridge-deprecated': ['connection.bridge'],
        'connect-popup': ['connect'],
        udev: ['connection.udev'],
        'switch-device': ['wallet-access'],
        onboarding: ['onboarding'],
        'password-manager': ['labeling.password-manager'],
        settings: ['app-settings', 'device-settings', 'network-settings', 'connect'],
        recovery: ['device-settings.check-backup'],
        backup: ['device-settings.backup'],
        firmware: ['device-settings.firmware'],
        'firmware-type': ['device-settings.firmware-type'],
        'firmware-custom': ['device-settings.custom-firmware'],
        'create-multi-share-backup': ['device-settings.backup.multi-share'],
        'create-wallet-backup': ['device-settings.backup.additional-nfc'],
        wallet: [
            'wallet.accounts',
            'wallet.send',
            'wallet.receive',
            'wallet.transactions',
            'trade',
            'earn',
        ],
        notifications: ['help.activity'],
        'apps-embedding': ['connect'],
    };
    const internalRoutes = new Set([
        'settings-debug',
        'wallet-trade',
        'suite-version',
        'apps-embedding-index',
    ]);
    for (const m of pyFinditer(routePattern, routeText)) {
        const [, name, pattern, app] = m as unknown as [string, string, string, string];
        const internal = internalRoutes.has(name);
        routes.push({
            name,
            pattern,
            app,
            source: 'suite/router-config/src/routeConfig.ts',
            line: pyCount(routeText, '\n', 0, m.index) + 1,
            feature_ids: Object.hasOwn(routeGroups, app) ? routeGroups[app] : [],
            status: internal ? 'excluded-internal' : 'area-mapped',
            notes: 'Compatibility/redirect routes are not separate user capabilities; area mapping is not a runtime assertion.',
        });
    }
    const screenPaths = new Set<string>(
        pyGlob(pyJoin(REPO, 'suite-app'), '*/src/pages/*.tsx').filter(
            p => !pyPathName(p).includes('.test.'),
        ),
    );
    for (const root of ['suite-native-app', 'suite-native']) {
        for (const p of pyGlob(pyJoin(REPO, root), '*/src/**/screens/**/*.tsx')) {
            if (!pyPathName(p).includes('.test.')) screenPaths.add(p);
        }
        for (const p of pyGlob(pyJoin(REPO, root), '*/src/**/navigation/*Navigator.tsx'))
            screenPaths.add(p);
    }
    const surfaces: Obj[] = pySortedPaths(screenPaths).map(p => {
        const relative = pyRelativeTo(p, REPO);

        return {
            path: relative,
            feature_ids: sortedSet(refsOf(relative)),
            status: truthy(refsOf(relative)) ? 'direct-evidence' : 'enumerated-only',
        };
    });
    const surfacesByPath = new Map<Json, Obj>();
    for (const surface of surfaces) surfacesByPath.set(at(surface, 'path'), surface);
    const composition = new Map<Json, Obj[]>();
    const implementationRefs = new Map<string, Set<Json>>();
    for (const feature of features) {
        for (const evidence of atObjs(feature, 'evidence')) {
            const kind = at(evidence, 'kind');
            if (kind === 'implementation' || kind === 'route') {
                defaultGet(implementationRefs, atStr(evidence, 'path'), () => new Set<Json>()).add(
                    at(feature, 'id'),
                );
            }
        }
    }
    const importPattern = pyRe('(?:from\\s*|import\\s*\\()\\s*[\'\\"](\\.[^\'\\"]+)[\'\\"]');
    for (const [path, featureIds] of implementationRefs) {
        const parent = pyJoin(REPO, path);
        const text = readText(parent, { errors: 'replace' });
        for (const specifier of pyFindall(importPattern, text) as string[]) {
            const target = pyJoin(pyParent(parent), specifier);
            const candidates = [
                target,
                pyPathStr(target + '.tsx'),
                pyPathStr(target + '.ts'),
                pyJoin(target, 'index.tsx'),
                pyJoin(target, 'index.ts'),
            ];
            for (const candidate of candidates) {
                const relative = pyRelativeTo(pyResolve(candidate), REPO);
                if (surfacesByPath.has(relative)) {
                    defaultGet(composition, relative, () => []).push({
                        source: path,
                        feature_ids: sortedSet(featureIds),
                    });
                    break;
                }
            }
        }
    }
    for (const surface of surfaces) {
        const parents = unique(defaultGet(composition, at(surface, 'path'), () => []));
        if (parents.length) {
            surface.composition_sources = parents;
            if (at(surface, 'status') !== 'direct-evidence') {
                surface.status = 'composition-referenced';
                surface.feature_ids = sortedSet(
                    new Set(parents.flatMap(parent => atArr(parent, 'feature_ids'))),
                );
            }
        }
    }

    return {
        tests,
        desktop_routes: routes,
        screens_and_navigators: surfaces,
        notes: [
            'Evidence linkage measures source traceability, not test pass rate or test adequacy.',
            'Routes are mapped at area level; feature roots and evidence provide the finer references.',
            'Composition-referenced means an implementation evidence file imports that screen; it is a navigation trace, not independent leaf-level verification.',
            'Screen enumeration includes ancillary dialogs and internal screens; enumerated-only surfaces need explicit review before any exhaustive surface-coverage claim.',
        ],
    };
};

const writeCsvFile = (name: string, columns: readonly string[], rows: readonly Obj[]): void =>
    writeCsv(pyJoin(HERE, name), columns, rows);

const jsonText = (value: Json): string => pyJsonDumps(value, { ensureAscii: false });

export const build = (): void => {
    const parts = readParts();
    const reconciliation = readJson(pyJoin(HERE, 'parts/reconciliation.json')) as Obj;
    const reciprocalPath = pyJoin(HERE, 'parts/native-desktop-parity.json');
    if (pyExists(reciprocalPath)) {
        for (const update of atObjs(readJson(reciprocalPath), 'updates')) {
            if (truthy(get(update, 'equivalent_id'))) {
                pySetKey(
                    atObj(reconciliation, 'equivalences'),
                    atStr(update, 'id'),
                    update.equivalent_id,
                );
            }
        }
    }
    // The audited develop revision, not HEAD: committing regenerated output must not make the stamp stale.
    const snapshot = git('merge-base', 'HEAD', 'origin/develop');
    const [enriched, publishedBase] = enrich(collectFeatures(parts, reconciliation), snapshot);
    const sourceAdditions = readSourceAdditions();
    const [withRuntime, runtime, runtimeScope] = addRuntime(
        enriched,
        readRuntime(),
        snapshot,
        sourceAdditions,
    );
    const features = applyTeamOwnership(withRuntime);
    const coverageAxes: readonly string[] = AXES;
    const coverageAudit = attachAssessments(
        features,
        publishedBase,
        new Set(splitlines(git('diff', '--name-only', publishedBase, '--'))),
        new Set(splitlines(git('ls-files'))),
    );
    const edges: Obj[] = features
        .filter(f => truthy(at(f, 'parent_id')))
        .map(f => ({ source: f.parent_id, target: f.id, type: 'contains' }));
    edges.push(
        ...features.flatMap(f =>
            atArr(f, 'related_ids').map(other => ({
                source: f.id,
                target: other,
                type: 'related',
            })),
        ),
    );
    const audit = sourceAudit(features, parts);
    const auditTests = atObjs(audit, 'tests');
    const stats: Obj = {
        features: features.length,
        leaf_features: countTrue(features.map(f => at(f, 'current_is_leaf'))),
        root_areas: features.filter(f => at(f, 'parent_id') === null).length,
        max_depth: Math.max(...features.map(f => at(f, 'depth') as number)),
        raw_inventory_nodes:
            pyKeys(parts).reduce(
                (total, name) => total + atArr(atObj(parts, name), 'features').length,
                0,
            ) +
            atArr(runtime, 'new_feature_ids').length +
            sourceAdditions.length,
        explicit_equivalences: pyKeys(atObj(reconciliation, 'equivalences')).length,
        unique_evidence_files: new Set(
            features.flatMap(f => atObjs(f, 'evidence').map(e => at(e, 'path'))),
        ).size,
        screenshots: counterDict(features.map(f => at(atObj(f, 'screenshot'), 'status'))),
        platforms: pyDict(
            PLATFORMS.map(
                p => [p, counterDict(features.map(f => at(atObj(f, 'platforms'), p)))] as const,
            ),
        ),
        manual_test_files: auditTests.filter(t => at(t, 'kind') === 'manual').length,
        manual_source_dispositions: counterDict(
            auditTests.filter(t => at(t, 'kind') === 'manual').map(t => at(t, 'status')),
        ),
        automated_e2e_files: auditTests.filter(t => at(t, 'kind') === 'automated-e2e').length,
        automated_source_dispositions: counterDict(
            auditTests.filter(t => at(t, 'kind') !== 'manual').map(t => at(t, 'status')),
        ),
        desktop_routes: atArr(audit, 'desktop_routes').length,
        enumerated_screens_and_navigators: atArr(audit, 'screens_and_navigators').length,
        runtime_observations: at(runtimeScope, 'observations'),
        runtime_observed_features: at(runtimeScope, 'observed_features'),
        runtime_captured_screenshots: at(runtimeScope, 'captured_screenshots'),
        runtime_features_with_captures: at(runtimeScope, 'features_with_captures'),
        runtime_features_with_current_captures: at(runtimeScope, 'features_with_current_captures'),
        runtime_new_features: atArr(runtimeScope, 'new_feature_ids').length,
        source_added_features: sourceAdditions.length,
        test_quality_assessed_features: at(coverageAudit, 'features_assessed'),
        test_quality_assessment_count: at(coverageAudit, 'assessment_count'),
    };
    const dataset: Obj = {
        $schema: './schema.json',
        schema_version: '1.0.0',
        metadata: {
            title: 'Trezor Suite user feature map',
            audit_date: '2026-11-15',
            repository: 'trezor/trezor-suite',
            commit: snapshot,
            published_reference_base: publishedBase,
            verification:
                'Static implementation and scenario inspection only; no app flows or tests executed.',
            runtime_audit: runtimeScope,
            availability_semantics: {
                yes: 'User-facing implementation is exposed in the audited source; ordinary prerequisites still apply.',
                conditional:
                    'Exposed only with listed device, OS, account, network, provider, rollout or experiment conditions.',
                no: 'Explicitly unsupported or absent from the audited user-facing composition; not a claim about future releases.',
                unknown: 'Source evidence is insufficient for a defensible parity claim.',
            },
            scope: 'Suite desktop, Suite web and native mobile; SDK examples and backend internals excluded. Mobile means native app, not a phone browser.',
            ownership_semantics:
                'Product teams inferred from QA streams/domain; CODEOWNERS on roots means code-review ownership, not accountable product ownership.',
            link_policy:
                'Local links identify this exact checkout. GitHub links use the published ancestor only for unchanged files; newer local files have no GitHub URL.',
            methodology_sources: [
                'https://jpattonassociates.com/the-new-backlog/',
                'https://www.nngroup.com/articles/journey-mapping-101/',
                'https://www.nngroup.com/articles/ux-mapping-methods-study-guide/',
            ],
        },
        statistics: stats,
        features,
        edges,
        runtime,
        test_coverage_audit: coverageAudit,
        integration_examples: get(atObj(parts, 'services'), 'integration_examples', []),
        source_notes: pyDict(
            pyKeys(parts).map(name => [name, at(atObj(parts, name), 'notes')] as const),
        ),
    };
    dump('features.json', dataset);
    dump('source-audit.json', audit);
    dump('summary.json', stats);
    dump('test-coverage/audit.json', coverageAudit);
    const columns = [
        'id',
        'parent_id',
        'depth',
        'level',
        'name',
        'description',
        'breadcrumb',
        'desktop',
        'web',
        'mobile',
        'desktop_navigation',
        'web_navigation',
        'mobile_navigation',
        'navigation_alternatives',
        'team',
        'backend_team',
        'ownership_confidence',
        'conditions',
        'root_components',
        'root_links',
        'evidence',
        'screenshot_status',
        'screenshot_path',
        'scope',
        'runtime_order',
        'current_is_leaf',
        'runtime_observation_count',
        'runtime_observations',
        'captured_screenshot_count',
        'screenshots',
        'runtime_errata',
        ...coverageAxes.map(axis => axis + '_score'),
        'test_coverage',
    ];
    const rows: Obj[] = [];
    for (const f of features) {
        const row: Obj = {};
        for (const k of [
            'id',
            'parent_id',
            'depth',
            'level',
            'name',
            'description',
            'breadcrumb',
            'scope',
        ])
            pySetKey(row, k, at(f, k));
        for (const [key, value] of pyEntries(atObj(f, 'platforms'))) pySetKey(row, key, value);
        for (const p of PLATFORMS) pySetKey(row, p + '_navigation', at(atObj(f, 'navigation'), p));
        row.navigation_alternatives = jsonText(at(f, 'navigation_alternatives'));
        const roots = atObjs(f, 'roots');
        row.team = at(atObj(f, 'ownership'), 'team');
        row.backend_team = at(atObj(f, 'ownership'), 'backend_team');
        row.ownership_confidence = at(atObj(f, 'ownership'), 'confidence');
        row.conditions = pyStrJoin(' | ', atArr(f, 'conditions'));
        row.root_components = pyStrJoin(
            ' | ',
            pyMapIter(roots, r => pyConcat(at(r, 'path'), ':', pyStr(at(r, 'line')))),
        );
        row.root_links = pyStrJoin(
            ' | ',
            pyMapIter(roots, r => at(r, 'local_link')),
        );
        row.evidence = jsonText(at(f, 'evidence'));
        row.screenshot_status = at(atObj(f, 'screenshot'), 'status');
        row.screenshot_path = at(atObj(f, 'screenshot'), 'path');
        row.runtime_order = at(f, 'runtime_order');
        row.current_is_leaf = at(f, 'current_is_leaf');
        row.runtime_observation_count = atArr(f, 'runtime_observations').length;
        row.runtime_observations = jsonText(f.runtime_observations);
        row.captured_screenshot_count = atArr(f, 'screenshots').length;
        row.screenshots = jsonText(f.screenshots);
        row.runtime_errata = jsonText(at(f, 'runtime_errata'));
        rows.push(row);
        for (const axis of coverageAxes)
            row[axis + '_score'] = at(atObj(atObj(f, 'test_coverage'), axis), 'score');
        row.test_coverage = jsonText(at(f, 'test_coverage'));
    }
    writeCsvFile('features.csv', columns, rows);
    const qualityRows: Obj[] = [];
    for (const feature of features) {
        const row: Obj = {
            id: at(feature, 'id'),
            name: at(feature, 'name'),
            breadcrumb: at(feature, 'breadcrumb'),
        };
        for (const axis of coverageAxes) {
            const value = atObj(atObj(feature, 'test_coverage'), axis);
            row[axis + '_score'] = at(value, 'score');
            row[axis + '_confidence'] = at(value, 'confidence');
            row[axis + '_applicability'] = at(value, 'applicability');
            row[axis + '_rationale'] = at(value, 'rationale');
            row[axis + '_covered_intents'] = pyStrJoin(' | ', atArr(value, 'covered_intents'));
            row[axis + '_gaps'] = pyStrJoin(' | ', atArr(value, 'gaps'));
            row[axis + '_evidence'] = jsonText(at(value, 'evidence'));
        }
        qualityRows.push(row);
    }
    const qualitySuffixes = [
        '_score',
        '_confidence',
        '_applicability',
        '_rationale',
        '_covered_intents',
        '_gaps',
        '_evidence',
    ];
    writeCsvFile(
        'test-coverage.csv',
        [
            'id',
            'name',
            'breadcrumb',
            ...coverageAxes.flatMap(axis => qualitySuffixes.map(suffix => axis + suffix)),
        ],
        qualityRows,
    );
    const coverageRows: Obj[] = [];
    const superseded = new Set<Json>(atArr(runtimeScope, 'superseded_observation_ids'));
    for (const feature of features) {
        const featureId = at(feature, 'id');
        const observations = atObjs(feature, 'runtime_observations');
        const active = observations.filter(o => !superseded.has(at(o, 'id')));
        const captures = atObjs(feature, 'screenshots').filter(s =>
            atArr(s, 'effective_feature_ids').some(id => pyEquals(id, featureId)),
        );
        const row: Obj = {
            id: featureId,
            name: at(feature, 'name'),
            breadcrumb: at(feature, 'breadcrumb'),
            current_is_leaf: at(feature, 'current_is_leaf'),
            scope: at(feature, 'scope'),
        };
        for (const platform of PLATFORMS) {
            row[platform + '_availability'] = at(atObj(feature, 'platforms'), platform);
            const statuses = sortedSet(
                new Set(
                    active.filter(o => at(o, 'platform') === platform).map(o => at(o, 'status')),
                ),
            );
            row[platform + '_runtime'] = pyStrJoin(' | ', statuses) || 'not-observed';
        }
        row.current_screenshot_count = captures.length;
        row.screenshot_paths = pyStrJoin(
            ' | ',
            pyMapIter(captures, s => at(s, 'path')),
        );
        row.observed_models = pyStrJoin(
            ' | ',
            sortedSet(
                new Set(
                    active
                        .filter(o => at(o, 'status') === 'observed' && truthy(at(o, 'model')))
                        .map(o => o.model),
                ),
            ),
        );
        row.superseded_observation_count = observations.filter(o =>
            superseded.has(at(o, 'id')),
        ).length;
        coverageRows.push(row);
    }
    writeCsvFile(
        'runtime-coverage.csv',
        [
            'id',
            'name',
            'breadcrumb',
            'current_is_leaf',
            'scope',
            ...PLATFORMS.flatMap(platform => [platform + '_availability', platform + '_runtime']),
            'current_screenshot_count',
            'screenshot_paths',
            'observed_models',
            'superseded_observation_count',
        ],
        coverageRows,
    );
    writeCsvFile('edges.csv', ['source', 'target', 'type'], edges);
    writeCsvFile(
        'equivalences.csv',
        ['source_id', 'canonical_id'],
        pyEntries(atObj(reconciliation, 'equivalences')).map(([k, v]) => ({
            source_id: k,
            canonical_id: v,
        })),
    );
    writeText(
        pyJoin(HERE, 'feature-tree.txt'),
        pyStrJoin(
            '\n',
            pyMapIter(features, f =>
                pyConcat(
                    '  '.repeat(at(f, 'depth') as number),
                    at(f, 'name'),
                    ' [',
                    at(f, 'id'),
                    ']',
                ),
            ),
        ) + '\n',
    );
    const ns = 'http://graphml.graphdrawing.org/xmlns';
    xmlRegisterNamespace('', ns);
    const graphml = xmlElement('{' + ns + '}graphml');
    for (const key of [
        'name',
        'description',
        'desktop',
        'web',
        'mobile',
        'team',
        'backend_team',
        'component',
        ...coverageAxes.map(axis => axis + '_score'),
    ]) {
        xmlSubElement(graphml, '{' + ns + '}key', {
            id: key,
            for: 'node',
            'attr.name': key,
            'attr.type': key.endsWith('_score') ? 'int' : 'string',
        });
    }
    const graph = xmlSubElement(graphml, '{' + ns + '}graph', {
        id: 'suite-features',
        edgedefault: 'directed',
    });
    for (const f of features) {
        const node = xmlSubElement(graph, '{' + ns + '}node', { id: atStr(f, 'id') });
        const team = at(atObj(f, 'ownership'), 'team');
        const values = new Map<string, Json>([
            ['name', at(f, 'name')],
            ['description', at(f, 'description')],
        ]);
        for (const [key, value] of pyEntries(atObj(f, 'platforms'))) values.set(key, value);
        values.set('team', truthy(team) ? team : 'Unknown');
        values.set('backend_team', at(atObj(f, 'ownership'), 'backend_team'));
        values.set(
            'component',
            pyStrJoin(
                ' | ',
                pyMapIter(atObjs(f, 'roots'), r => at(r, 'local_link')),
            ),
        );
        for (const axis of coverageAxes)
            values.set(axis + '_score', pyStr(at(atObj(atObj(f, 'test_coverage'), axis), 'score')));
        for (const [key, value] of values) {
            // Non-string values are serialised (and rejected) by the XML writer, as ElementTree does.
            xmlSubElement(node, '{' + ns + '}data', { key }).text = value as unknown as
                string | null;
        }
    }
    edges
        .filter(e => at(e, 'type') === 'contains')
        .forEach((edge, i) => {
            xmlSubElement(graph, '{' + ns + '}edge', {
                id: 'e' + String(i),
                source: atStr(edge, 'source'),
                target: atStr(edge, 'target'),
            });
        });
    xmlIndent(graphml);
    xmlWrite(pyJoin(HERE, 'feature-map.graphml'), graphml);
    buildExplorer(); // reads the features.json written above
    const childMap = new Map<Json, Obj[]>();
    for (const feature of features) {
        if (at(feature, 'scope') === 'user-facing')
            defaultGet(childMap, at(feature, 'parent_id'), () => []).push(feature);
    }

    const outline = (feature: Obj): string => {
        const name = pyHtmlEscape(atStr(feature, 'name'));
        const availability = [
            ['D', 'desktop'],
            ['W', 'web'],
            ['M', 'mobile'],
        ]
            .map(([short, platform]) =>
                pyConcat(short, ': ', at(atObj(feature, 'platforms'), platform)),
            )
            .join(' · ');
        let status = '<span class="availability text-small">' + availability + '</span>';
        const scores = [
            ['Desktop E2E', 'desktop_automated'],
            ['Android E2E', 'android_automated'],
            ['Desktop manual', 'desktop_manual'],
            ['Android manual', 'android_manual'],
        ]
            .map(
                ([label, axis]) =>
                    label +
                    ': ' +
                    pyStr(at(atObj(atObj(feature, 'test_coverage'), axis), 'score')) +
                    '/10',
            )
            .join(' · ');
        status += '<span class="availability text-small">' + scores + '</span>';
        const children = defaultGet(childMap, at(feature, 'id'), () => []);
        if (children.length) {
            return (
                '<details><summary>' +
                name +
                status +
                '</summary><div class="children">' +
                children.map(child => outline(child)).join('') +
                '</div></details>\n'
            );
        }

        return '<div class="leaf">' + name + status + '</div>\n';
    };

    let overview = readText(pyJoin(HERE, 'overview.template.html'));
    overview = overview.split('__FEATURE_OUTLINE__').join(
        defaultGet(childMap, null, () => [])
            .map(f => outline(f))
            .join(''),
    );
    writeText(pyJoin(HERE, 'overview.html'), overview);
    process.stdout.write(pyJsonDumps(stats, { indent: 2 }) + '\n');
};

if (isMain(import.meta.filename)) {
    pyParseNoArgs(nodePath.basename(process.argv[1]), DESCRIPTION);
    build();
}
