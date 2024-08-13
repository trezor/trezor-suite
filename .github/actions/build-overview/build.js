// process args [name, href]
//
const [branch, job, url] = process.argv.slice(2);

console.log('branch:', branch);
console.log('job:', job);
console.log('url:', url);

// fetch data
// const dataUrl = `https://dev.suite.sldev.cz/meta/${branch}/data.json`;
const dataUrl = 'https://jsonplaceholder.typicode.com/todos/1';

const getData = async () => {
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            console.log('fetch data:', data);
            return data;
        })
        .catch(error => {
            console.log('fetch error:', error);
            return {};
        });
};

const run = async () => {
    const data = await getData();
    console.log('data:', data);
};

const data = [
    {
        name: 'meow',
        href: 'https://www.google.com',
    },
];

//
