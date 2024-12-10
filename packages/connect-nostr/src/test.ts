import { NostrClient } from '.';

const run = async () => {
    const client = new NostrClient({
        nsecStr: 'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
        relayUrl: 'wss://relay.primal.net',
    });

    await client.connect();

    client.subscribe({ pubKeys: [client.pk] });

    client.on('event', e => {
        console.log('meow event,', e);
    });

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

run();
