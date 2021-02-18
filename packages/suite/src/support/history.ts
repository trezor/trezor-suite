import { createBrowserHistory, createMemoryHistory } from 'history';

/**
 * Desktop prod needs to use memory based routing
 */
const isDesktop = process.env.SUITE_TYPE === 'desktop';

export default isDesktop ? createMemoryHistory() : createBrowserHistory();
