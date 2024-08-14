const getData = require('./get-data');
const processArgs = require('./process-args');
/**
 * Content of index overview page is defined by a JSON stored in a well-known location.
 */

// console.log('branch:', branch);
// console.log('job:', job);
// console.log('url:', url);

const run = async () => {
    const [branch, job, url] = processArgs();
    const data = (await getData(branch)) || {};

    data[job] = url;

    process.stdout.write(JSON.stringify(data));
};

run();
