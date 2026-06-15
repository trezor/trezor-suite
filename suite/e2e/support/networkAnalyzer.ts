import { exec } from 'child_process';

export type TcpConnection = {
    command: string;
    pid: string;
    localEndpoint: string;
    remoteEndpoint: string;
    remoteHost: string;
    remotePort: string;
    raw: string;
};

// Loopback addresses whose traffic never leaves the machine. When Tor is enabled, the Suite
// (electron/node) processes must only talk to the local Tor SOCKS proxy and other localhost
// services. The bundled `tor` process is the only one allowed to reach the outside world.
const isLoopbackHost = (host: string): boolean => {
    const normalized = host.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();

    return (
        normalized === 'localhost' ||
        normalized === '::1' ||
        normalized === '::' ||
        normalized === '0.0.0.0' ||
        normalized.startsWith('127.')
    );
};

const parseRemoteEndpoint = (remoteEndpoint: string): { host: string; port: string } => {
    // IPv6 endpoints are wrapped in brackets, e.g. [2600:9000:207f::1]:443
    const ipv6Match = remoteEndpoint.match(/^\[(?<host>.+)\]:(?<port>\d+|\*)$/);
    if (ipv6Match?.groups?.host && ipv6Match.groups.port) {
        return { host: ipv6Match.groups.host, port: ipv6Match.groups.port };
    }

    const lastColon = remoteEndpoint.lastIndexOf(':');

    return {
        host: remoteEndpoint.slice(0, lastColon),
        port: remoteEndpoint.slice(lastColon + 1),
    };
};

const parseLsofLine = (line: string): TcpConnection | null => {
    // electron 169557 user 130u IPv4 1909466 0t0 TCP 127.0.0.1:45022->142.250.1.1:443 (ESTABLISHED)
    const match = line.match(
        /^(?<command>\S+)\s+(?<pid>\d+)\s+.*\bTCP\s+(?<local>\S+)->(?<remote>\S+)\s+\(ESTABLISHED\)/,
    );
    const groups = match?.groups;
    if (!groups?.command || !groups.pid || !groups.local || !groups.remote) {
        return null;
    }

    const { host, port } = parseRemoteEndpoint(groups.remote);

    return {
        command: groups.command,
        pid: groups.pid,
        localEndpoint: groups.local,
        remoteEndpoint: groups.remote,
        remoteHost: host,
        remotePort: port,
        raw: line.trim(),
    };
};

// Inspects established TCP connections opened by the Suite (electron) and node processes,
// mirroring the manual command used to verify Tor routing:
//   watch -n 1 "lsof -i TCP | grep -E 'electron|node'"
export class NetworkAnalyzer {
    private interval?: ReturnType<typeof setInterval>;
    // Keyed by remote endpoint to de-duplicate connections observed across polling cycles.
    private readonly externalConnections = new Map<string, TcpConnection>();

    // `-n` disables hostname resolution and `-P` disables port-name resolution, so the output
    // always contains numeric addresses, which makes localhost detection reliable.
    private static readonly LSOF_COMMAND = 'lsof -nP -iTCP -sTCP:ESTABLISHED';

    getConnections(): Promise<TcpConnection[]> {
        return new Promise(resolve => {
            // lsof exits with code 1 when there are no matching connections, so the error
            // argument is intentionally ignored and only stdout is parsed.
            exec(NetworkAnalyzer.LSOF_COMMAND, (_error, stdout) => {
                const connections = stdout
                    .split('\n')
                    .filter(line => /^(electron|node)\b/.test(line))
                    .map(parseLsofLine)
                    .filter((connection): connection is TcpConnection => connection !== null);

                resolve(connections);
            });
        });
    }

    async getExternalConnections(): Promise<TcpConnection[]> {
        const connections = await this.getConnections();

        return connections.filter(connection => !isLoopbackHost(connection.remoteHost));
    }

    start(intervalMs = 1000): void {
        this.interval = setInterval(async () => {
            const external = await this.getExternalConnections();
            external.forEach(connection => {
                this.externalConnections.set(connection.remoteEndpoint, connection);
            });
        }, intervalMs);
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    getCollectedExternalConnections(): TcpConnection[] {
        return Array.from(this.externalConnections.values());
    }
}
