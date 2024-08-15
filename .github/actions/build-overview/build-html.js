const getData = require('./get-data');
const processArgs = require('./process-args');

const run = async () => {
    const [data_raw] = processArgs();
    const data = JSON.parse(data_raw);

    if (!data) {
        return process.exit(1);
    }
    console.log('fetched data:', data);
    let html = '<html><head><title>Overview</title></head><body><h1>Overview</h1>';

    Object.keys(data).forEach(key => {
        html += `<a href="${data[key].url}">${key} meow</a><br>`;
    });

    html += '</body></html>';

    process.stdout.write(JSON.stringify(html));
};

run();
