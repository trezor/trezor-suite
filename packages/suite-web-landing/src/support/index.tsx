import React from 'react';
import ReactDOM from 'react-dom';
import Main from '../Main';

const App = () => <h1>Hello world!</h1>;

ReactDOM.render(Main, document.getElementById('app'));

document.dispatchEvent(new Event('__RENDERED__'));
