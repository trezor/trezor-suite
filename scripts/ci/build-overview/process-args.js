const processArgs = () => {
    const [branch, job, url] = process.argv.slice(2);
    return [branch, job, url];
};

module.exports = processArgs;
