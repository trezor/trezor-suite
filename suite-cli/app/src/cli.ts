import { createCliCompositionRoot } from './createCliCompositionRoot';

const { cliApp } = createCliCompositionRoot();

cliApp(process.argv.slice(2))
    .then(exitCode => {
        process.exitCode = exitCode;
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
