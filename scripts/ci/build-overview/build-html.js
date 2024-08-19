const getData = require('./get-data');
const processArgs = require('./process-args');

const run = async () => {
    const [branch, job, url] = processArgs();

    const data = await getData(branch);

    if (!data) {
        console.log('no data available');
        return process.exit(1);
    }
    console.log('fetched data:', data);
    let html = '<html><head><title>Overview</title></head><body><h1>Overview</h1>';

    Object.keys(data).forEach(key => {
        html += `<a href="${data[key].url}">${key} meow</a><br>`;
    });

    html += '</body></html>';

    process.stdout.write(JSON.stringify(data));
};

run();
