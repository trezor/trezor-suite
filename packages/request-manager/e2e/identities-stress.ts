import path from 'path';
import { createInterceptor, TorController } from '../src';
import { torRunner } from './torRunner';

// The purpose of this script is to allow "manual" testing Tor identities changing some parameters.
// Run it like:
// yarn workspace @trezor/request-manager test:stress
// While running this you can run the command below to check that everything is going throw Tor
// watch -n 1 "lsof -i TCP | grep node"

const host = 'localhost';
const port = 38835;
const controlPort = 35527;
const processId = process.pid;
const torDataDir = path.join(__dirname, 'tmp');
const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

const INTERCEPTOR = {
    handler: () => {},
    getTorSettings: () => ({ running: true, host, port }),
};

const testGetUrlHttps = 'https://check.torproject.org/';

const amountOfIdentities = 20;
const intervalBetweenRequests = 1000 * 20;

(async () => {
    // Callback in in createInterceptor should return true in order for the request to use Tor.
    createInterceptor(INTERCEPTOR);

    console.log('Starting Tor.');
    // Starting Tor controller to make sure that Tor is running.
    const torController = new TorController({
        host,
        port,
        controlPort,
        torDataDir,
    });
    const torParams = torController.getTorConfiguration(processId);
    // Starting Tor process from binary.
    torRunner({
        torParams,
    });

    // Waiting for Tor to be ready to accept successful connections.
    await torController.waitUntilAlive();
    console.log('Tor is ready to be used.');

    // Create identities
    const identities: string[] = [];
    for (let identity = 0; identity < amountOfIdentities; identity++) {
        console.log('identity', identity);
        identities.push(`Basic ${identity}`);
    }

    const makeRequests = async (identities: any) => {
        const promises: Promise<Response>[] = identities.map((identity: string) => {
            console.log('identity', identity);

            return fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': identity },
            });
        });

        // Call the identities request
        const responseIdentities = await Promise.all(promises);
        // Parse requests
        const requests = responseIdentities.map(async response => {
            const text: any = await response.text();
            const ip = text.match(ipRegex)[0];

            return {
                ip,
            };
        });

        return Promise.all(requests);
    };

    try {
        const ips = await makeRequests(identities);
        console.log('ips', ips);
    } catch (error) {
        console.error(error);
    }

    setInterval(async () => {
        try {
            const ips = await makeRequests(identities);
            console.log('ips', ips);
        } catch (error) {
            console.error(error);
        }
    }, intervalBetweenRequests);
})();
