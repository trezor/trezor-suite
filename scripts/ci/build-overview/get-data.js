const getData = async branch => {
    const dataUrl = `https://dev.suite.sldev.cz/meta/${branch}/data.json`;
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            return null;
        });
};

module.exports = getData;
