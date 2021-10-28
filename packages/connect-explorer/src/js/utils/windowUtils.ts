export const getQueryVariable = (variable: string) => {
    const query = window.location.hash.substr(3);
    console.log('--- window.location', window.location);
    console.log('query', query);
    const vars = query.split('&');
    console.log('vars', vars);
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        console.log('pair', pair, decodeURIComponent(pair[0]));
        if (decodeURIComponent(pair[0]) === variable) {
            return decodeURIComponent(pair[1]);
        }
    }
};
