const psList = require('ps-list');
const os = require('os');
const { spawn } = require('child_process');

const processes = await psList();
const bridgeProcess = processes.find(ps => ps.name.includes('trezord'));
const platform = os.platform();

console.log({
    platform,
    bridgeProcess,
});

console.log('bridgeProcess', bridgeProcess);

// bridge is not running, run
// if(!bridgeProcess) {

    switch(platform) {
        case "darwin": {
            spawn('ls', ['-lh', '/usr']);
        }
    }

// }