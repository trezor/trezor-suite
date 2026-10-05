import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Lists open Dependabot alerts of the trezor-suite repo, deduplicated by the installed version,
 * with a probable owning team, and prints markdown body of an issue to stdout.
 * If run with --create-issue, it creates the issue in the private repo using `gh`.
 *
 * Example usage: yarn triage-dependabot-alerts high > temp.md
 */

const ALERTS_REPO = 'trezor/trezor-suite';
const ISSUE_REPO = 'trezor/trezor-suite-private';
const MAX_ISSUE_BODY_LENGTH = 65536; // https://github.com/orgs/community/discussions/27190 (it's not in official docs)
const OWNERSHIP_LISTS_DIR = path.join(import.meta.dirname, 'list-outdated-dependencies');

const severities = ['low', 'medium', 'high', 'critical'] as const;
type Severity = (typeof severities)[number];

// Type is advisory only, may not be up-to-date.
type TeamKey = 'connect' | 'earn' | 'growth' | 'networks' | 'qa' | 'trade' | 'wallet';

type DependabotAlert = {
    number: number;
    html_url: string;
    dependency: {
        package: { name: string };
        scope: 'runtime' | 'development' | null;
    };
    security_advisory: { summary: string };
    security_vulnerability: {
        severity: Severity;
        vulnerable_version_range: string;
        first_patched_version: { identifier: string } | null;
    };
};

type YarnWhyNode = {
    value: string | { locator: string; descriptor: string };
    children: Record<string, YarnWhyNode>;
};

type DependencyPath = {
    // From the workspace to the vulnerable package, both excluded.
    intermediateLocators: string[];
    vulnerableDescriptor: string;
};

type AlertGroup = {
    packageName: string;
    installedVersion: string;
    dependencyPath: DependencyPath;
    alerts: DependabotAlert[];
};

const runCommand = (command: string, args: string[], input?: string) =>
    execFileSync(command, args, { encoding: 'utf-8', input, maxBuffer: 512 * 1024 * 1024 });

const log = (message: string) => console.error(message);

const getSeverityRank = (severity: Severity) => severities.indexOf(severity);

const getOpenAlerts = (minSeverity: Severity): DependabotAlert[] => {
    const selectedSeverities = severities.slice(getSeverityRank(minSeverity)).join(',');
    const output = runCommand('gh', [
        'api',
        '--paginate',
        '--jq',
        '.[]',
        `repos/${ALERTS_REPO}/dependabot/alerts?state=open&ecosystem=npm&severity=${selectedSeverities}&per_page=100`,
    ]);

    return output
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
};

/**
 * Constructs a map of all explicitely installed dependencies, mapping to their owner.
 */
const getOwnershipByPackage = () => {
    const ownershipByPackage = new Map<string, TeamKey>();

    fs.readdirSync(OWNERSHIP_LISTS_DIR)
        .filter(fileName => fileName.endsWith('-dependencies.txt'))
        .forEach(fileName => {
            const teamKey = fileName.replace('-dependencies.txt', '') as TeamKey;

            fs.readFileSync(path.join(OWNERSHIP_LISTS_DIR, fileName), 'utf-8')
                .split('\n')
                .map(line => line.replace(/#.*$/, '').trim())
                .filter(Boolean)
                .forEach(packageName => ownershipByPackage.set(packageName, teamKey));
        });

    return ownershipByPackage;
};

const getLocator = (node: YarnWhyNode) =>
    typeof node.value === 'string' ? node.value : node.value.locator;

const isWorkspaceLocator = (locator: string) => locator.includes('@workspace:');

// The separator is the first `@` that is not the scope prefix.
const getLocatorName = (locator: string) => locator.slice(0, locator.indexOf('@', 1));

// Handles plain `name@npm:1.2.3`, aliases `name@npm:other@1.2.3`, packages with peer dependencies
// `name@virtual:<hash>#npm:1.2.3` and patches `name@patch:name@npm%3A1.2.3#...::version=1.2.3&hash=...`.
const getLocatorVersion = (locator: string) => {
    const patchedVersion = locator.match(/::version=([^&]+)/)?.[1];
    if (patchedVersion) return patchedVersion;

    const reference = locator
        .slice(locator.indexOf('@', 1) + 1)
        .replace(/^virtual:[^#]*#/, '')
        .replace(/^npm:/, '');

    return reference.slice(reference.lastIndexOf('@') + 1);
};

// `yarn why -R` prints every node fully only on its first occurrence, later occurrences have
// their children omitted. So the first depth-first match is guaranteed to be a complete path.
const findDependencyPaths = (packageName: string) => {
    const pathsByVersion = new Map<string, DependencyPath>();

    const visitNode = (node: YarnWhyNode, ancestorLocators: string[]) => {
        const locator = getLocator(node);

        if (typeof node.value !== 'string' && getLocatorName(locator) === packageName) {
            const version = getLocatorVersion(locator);

            if (!pathsByVersion.has(version)) {
                pathsByVersion.set(version, {
                    intermediateLocators: ancestorLocators.slice(1),
                    vulnerableDescriptor: node.value.descriptor,
                });
            }
        }

        Object.values(node.children).forEach(child =>
            visitNode(child, [...ancestorLocators, locator]),
        );
    };

    runCommand('yarn', ['why', '-R', '--json', packageName])
        .split('\n')
        .filter(Boolean)
        .forEach(line => visitNode(JSON.parse(line), []));

    return pathsByVersion;
};

/**
 * Groups alerts by the vulnerable package version installed in the lockfile, alerts matching no installed version are returned as stale.
 */
const groupAlerts = (alerts: DependabotAlert[]) => {
    const groups = new Map<string, AlertGroup>();
    const staleAlerts: DependabotAlert[] = [];
    const packageNames = [...new Set(alerts.map(alert => alert.dependency.package.name))];

    packageNames.forEach((packageName, index) => {
        log(`[${index + 1}/${packageNames.length}] yarn why -R ${packageName}`);
        const pathsByVersion = findDependencyPaths(packageName);

        alerts
            .filter(alert => alert.dependency.package.name === packageName)
            .forEach(alert => {
                // GitHub separates comparators by a comma, e.g. `>= 1.13.0, < 1.20.0`.
                const vulnerableRange =
                    alert.security_vulnerability.vulnerable_version_range.replaceAll(',', ' ');
                const vulnerableVersions = [...pathsByVersion.keys()].filter(version =>
                    semver.satisfies(version, vulnerableRange),
                );

                if (vulnerableVersions.length === 0) {
                    staleAlerts.push(alert);
                }

                vulnerableVersions.forEach(installedVersion => {
                    const key = `${packageName}@${installedVersion}`;
                    const group = groups.get(key) ?? {
                        packageName,
                        installedVersion,
                        dependencyPath: pathsByVersion.get(installedVersion)!,
                        alerts: [],
                    };
                    group.alerts.push(alert);
                    groups.set(key, group);
                });
            });
    });

    return { groups: [...groups.values()], staleAlerts };
};

/**
 * Returns the lowest version fixing all alerts of the group, with warnings if it is outside the requested range or some alerts have no fix.
 */
const getPatchedVersion = ({ alerts, dependencyPath }: AlertGroup) => {
    const patchedVersions = alerts.map(
        alert => alert.security_vulnerability.first_patched_version?.identifier,
    );
    const knownPatchedVersions = patchedVersions.filter(version => version !== undefined);

    if (knownPatchedVersions.length === 0) {
        return 'none';
    }

    const patchedVersion = knownPatchedVersions.reduce((highest, version) =>
        semver.gt(version, highest) ? version : highest,
    );
    const requestedRange = dependencyPath.vulnerableDescriptor.split('@npm:')[1];
    const isOutsideRequestedRange =
        !!requestedRange &&
        !!semver.validRange(requestedRange) &&
        !semver.satisfies(patchedVersion, requestedRange);
    const isPartiallyPatched = knownPatchedVersions.length < patchedVersions.length;

    return [
        patchedVersion,
        isOutsideRequestedRange ? `⚠️ outside \`${requestedRange}\`` : '',
        isPartiallyPatched ? '⚠️ some alerts have no fix' : '',
    ]
        .filter(Boolean)
        .join(' ');
};

/**
 * Returns the team owning the explicitly installed dependency through which the vulnerable package is installed.
 */
const getOwnership = (
    { packageName, dependencyPath }: AlertGroup,
    ownershipByPackage: Map<string, TeamKey>,
) => {
    // The first non-workspace package on the path is explicitly installed in a workspace.
    const explicitDependency =
        dependencyPath.intermediateLocators
            .filter(locator => !isWorkspaceLocator(locator))
            .map(getLocatorName)[0] ?? packageName;
    const team: TeamKey | '❓ unowned' = ownershipByPackage.get(explicitDependency) ?? '❓ unowned';

    return explicitDependency === packageName ? team : `${team} via \`${explicitDependency}\``;
};

const escapeTableCell = (text: string) => text.replaceAll('|', '\\|');

const renderAlertLink = (alert: DependabotAlert) => `[#${alert.number}](${alert.html_url})`;

const renderIssueBody = (
    minSeverity: Severity,
    { groups, staleAlerts }: ReturnType<typeof groupAlerts>,
    ownershipByPackage: Map<string, TeamKey>,
) => {
    const rows = groups
        .flatMap(group => {
            const alerts = group.alerts.toSorted(
                (a, b) =>
                    getSeverityRank(b.security_vulnerability.severity) -
                        getSeverityRank(a.security_vulnerability.severity) || a.number - b.number,
            );
            const [mainAlert] = alerts;
            if (!mainAlert) return [];

            const otherAlertsCount = alerts.length - 1;
            const isRuntime = alerts.some(alert => alert.dependency.scope === 'runtime');
            const { severity } = mainAlert.security_vulnerability;

            return {
                severity,
                ownership: getOwnership(group, ownershipByPackage),
                cells: [
                    severity,
                    alerts.map(renderAlertLink).join(', '),
                    escapeTableCell(
                        mainAlert.security_advisory.summary +
                            (otherAlertsCount > 0 ? ` (+${otherAlertsCount} more)` : ''),
                    ),
                    `\`${group.packageName}\``,
                    group.installedVersion,
                    getPatchedVersion(group),
                    isRuntime ? 'runtime' : 'development',
                ],
            };
        })
        .toSorted(
            (a, b) =>
                Number(a.ownership.startsWith('❓')) - Number(b.ownership.startsWith('❓')) ||
                a.ownership.localeCompare(b.ownership) ||
                getSeverityRank(b.severity) - getSeverityRank(a.severity),
        );

    const tableRows = rows.map(row => `| ${[...row.cells, row.ownership].join(' | ')} |`);
    const staleAlertsSection =
        staleAlerts.length > 0
            ? [
                  '',
                  '### Possibly stale alerts',
                  '',
                  'No installed version matches the vulnerable range, the lockfile is probably already fixed and the alert awaits a rescan:',
                  staleAlerts
                      .map(
                          alert => `${renderAlertLink(alert)} \`${alert.dependency.package.name}\``,
                      )
                      .join(', '),
              ]
            : [];

    const todayDateString = new Date().toISOString().slice(0, 10);

    return [
        `🤖 Generated by the \`yarn triage-dependabot-alerts\` script at ${todayDateString}.`,
        '',
        `Open npm Dependabot alerts of severity **${minSeverity}** from https://github.com/${ALERTS_REPO}/security/dependabot, deduplicated by the installed version (${groups.length} rows from ${new Set(groups.flatMap(group => group.alerts)).size} alerts).`,
        '',
        'Ownership is _probable_: transitive dependencies are attributed to the first explicitly installed dependency found by `yarn why -R`, but other dependencies may rely on them as well.',
        '',
        '| severity | link | alert title | npm identifier | current | patched | scope | ownership |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        ...tableRows,
        ...staleAlertsSection,
        '',
        '### How to fix (suggestions)',
        '',
        '- **Explicit dependency**: bump it in all `package.json` files (or use `ncu` if installed locally), then `yarn`.',
        '- **Transitive dependency**: force the lockfile resolution of the offending descriptor, e.g. `yarn set resolution undici@npm:^1.2.3 npm:1.2.4` (see `yarn why <package>` for the descriptors).',
        '- **Patched version outside the requested range** (marked ⚠️): the dependent package may break, as the fix crosses its semver range (note that for `0.x` versions, each minor is breaking). Prefer bumping the dependent package to a version that requires the fix. Otherwise force it knowingly via `yarn set resolution` or root `resolutions` and test the affected functionality.',
        '- **`npmMinimalAgeGate`**: if the patched version cannot be installed because it is too new, feel free to add an exception to `npmPreapprovedPackages` in `.yarnrc.yml`. Security fixes are a sensible override of this rule.',
        '',
        'Ultimately, it is up to the implementer how to proceed with the fixes.',
    ].join('\n');
};

const createIssue = (minSeverity: Severity, body: string) => {
    if (body.length > MAX_ISSUE_BODY_LENGTH) {
        log(
            `Issue body has ${body.length} characters, more than GitHub allows (${MAX_ISSUE_BODY_LENGTH}). Use a higher severity.`,
        );
        process.exit(1);
    }

    const date = new Date().toISOString().slice(0, 10);
    const issueUrl = runCommand(
        'gh',
        [
            'issue',
            'create',
            '--repo',
            ISSUE_REPO,
            '--title',
            `Dependabot alerts triage: ${minSeverity} and higher (${date})`,
            '--body-file',
            '-',
        ],
        body,
    );

    log(`Created issue: ${issueUrl.trim()}`);
};

(() => {
    const { minSeverity, createIssue: shouldCreateIssue } = yargs(hideBin(process.argv))
        .command('$0 [minSeverity]', 'Triage open Dependabot alerts into a GitHub issue')
        .positional('minSeverity', { choices: severities, default: 'high' as Severity })
        .option('create-issue', {
            type: 'boolean',
            default: false,
            describe: `Create the issue in ${ISSUE_REPO} with the content printed to stdout`,
        })
        .strict()
        .parseSync();

    const alerts = getOpenAlerts(minSeverity);
    log(`Fetched ${alerts.length} open alerts of severity ${minSeverity} and higher.`);

    const body = renderIssueBody(minSeverity, groupAlerts(alerts), getOwnershipByPackage());

    if (shouldCreateIssue) {
        createIssue(minSeverity, body);
    }

    // Always print the raw markdow to stdout.
    console.log(body);
})();
