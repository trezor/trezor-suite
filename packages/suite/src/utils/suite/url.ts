export const getPrettyUrl = (url: string) => {
    let pretty = url;
    pretty = pretty.replace('https://', '').replace('http://', '');
    const slash = pretty.indexOf('/');
    if (slash !== -1) {
        pretty = pretty.substr(0, slash);
    }
    return pretty;
};
