'use strict';
class MemoryReporter {
    onTestResult(test, result) {
        const { rss, heapUsed, heapTotal, external } = process.memoryUsage();
        process.stderr.write('[import-only-memory] ' + JSON.stringify({
            file: test.path.split('/').pop(),
            parentPid: process.pid,
            workerHeapUsed: result.memoryUsage ?? null,
            rss, heapUsed, heapTotal, external,
            runtime: result.perfStats.runtime,
            failed: result.numFailingTests,
            skipped: result.numPendingTests,
            error: Boolean(result.testExecError),
        }) + '\n');
    }
}
module.exports = MemoryReporter;
