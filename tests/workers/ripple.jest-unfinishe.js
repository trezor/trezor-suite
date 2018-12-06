
//import Ripple from '../../src/workers/ripple';
// import RippleWorker from 'worker-loader?name=ripple-worker.js!../../src/workers/ripple/index.js';
import Worker from 'jest-worker';

describe('Ripple worker:', () => {
    it('Handshake', () => {
        // const worker = new Worker('../../src/workers/ripple/index.js');
        // const worker = new Worker('/Users/szymon.lesisz/Workspace/SatoshiLabs/blockchain-link/src/workers/ripple/index.js');
        // worker.postMessage('HELLO', Ripple);
        //console.log("Rip", Ripple)

        const worker = new Worker('/Users/szymon.lesisz/Workspace/SatoshiLabs/blockchain-link/build/workers/ripple-worker.js');
        // var worker = new Worker(function(){
        //     postMessage("I'm working before postMessage('ali').");
        //     this.onmessage = function(event) {
        //         postMessage('Hi ' + event.data);
        //         self.close();
        //     };
        // });
        worker.onmessage = function(event) {
            console.log("Worker said : " + event.data);
        };
        worker.postMessage('ali');

        console.warn("WORKER", worker)
    });

});