const psList = require('ps-list');
const os = require('os');
const { spawn } = require('child_process');

const TREZOR_PROCESS_NAME = 'trezord';

const processes = await psList();
const platform = os.platform();
const bridgeProcess = processes.find(ps => ps.name.includes(TREZOR_PROCESS_NAME));

console.log({
    platform,
    bridgeProcess,
});

// bridge is not running, run
if(!bridgeProcess) {
    switch(platform) {
        case "darwin": {
            spawn('ls', ['-lh', '/usr']);
        }
    }
}