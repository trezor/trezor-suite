// https://github.com/zeit/next.js/issues/4768
declare module 'worker-loader?name=static/[hash].worker.js!*' {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}
