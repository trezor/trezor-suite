import '@babel/polyfill';
import './commands';

beforeEach(() => {
    window.localStorage.setItem('/betaModalPrivacy', true);
});
