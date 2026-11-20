type UrlWithHttps = `https://${string}`;

/**
 * Headers directing CSP or other violation reporting to a given endpoint
 */
export function createReportingHeaders<Group extends string, ReporUrl extends UrlWithHttps>(
    cspGroup: Group,
    cspReportUrl: ReporUrl,
) {
    return {
        'report-to': JSON.stringify({
            group: cspGroup,
            max_age: 10886400,
            endpoints: [{ url: cspReportUrl }],
            include_subdomains: true,
        }),
        'reporting-endpoints': `${cspGroup}=${cspReportUrl}`,
    } as const;
}
