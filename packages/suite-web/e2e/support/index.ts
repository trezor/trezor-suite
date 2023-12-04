import './commands';
import 'cypress-file-upload';
import 'cypress-real-events';

// Hide fetch/XHR requests
const app: any = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
    const style = app.document.createElement('style');
    style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
    style.setAttribute('data-hide-command-log-request', '');
    app.document.head.appendChild(style);
}
