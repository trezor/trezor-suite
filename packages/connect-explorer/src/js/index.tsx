import React from 'react';
import { render } from 'react-dom';
import store from './store';
import App from './router';
import { onResize } from './actions/DOMActions';
// @ts-ignore
import styles from '../styles';

const root = document.getElementById('root');
if (root) {
    render(<App />, root);
}

// does nothing so commenting out
// window.onbeforeunload = () => {
//     store.dispatch(onBeforeUnload());
// };

if (typeof module !== 'undefined' && Object.prototype.hasOwnProperty.call(module, 'hot')) {
    module.hot.accept();
}

window.addEventListener('resize', () => {
    store.dispatch(onResize());
});

export default App;
