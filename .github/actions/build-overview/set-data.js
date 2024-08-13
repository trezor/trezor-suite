/**
 * Content of index overview page is defined by a JSON stored in a well-known location.
 */
const [branch, job, url] = process.argv.slice(2);

// console.log('branch:', branch);
// console.log('job:', job);
// console.log('url:', url);

// fetch data
const dataUrl = `https://dev.suite.sldev.cz/meta/${branch}/data.json`;
// const dataUrl = 'https://jsonplaceholder.typicode.com/todos/1';

const getData = async () => {
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            return null;
        });
};

const run = async () => {
    const data = (await getData()) || {};

    data[job] = url;

    process.stdout.write(JSON.stringify(data));
};

run();
