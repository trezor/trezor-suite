// socks-proxy-agent is not supported in browser
// use fallback module. see package.json "browser" field

const createSocksProxyAgent = (_opts: string) => ({});

export default createSocksProxyAgent;
