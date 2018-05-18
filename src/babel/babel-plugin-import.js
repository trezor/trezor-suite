// inspired by:
// https://github.com/entwicklerstube/babel-plugin-root-import/
// Simple plugin allows es6 import from '~/' which is src root

const cwd = process.cwd();

const replacePrefix = (path, opts = [], sourceFile) => {
    const options = [].concat(opts);
    if (typeof path === 'string') {
        if (path.indexOf('~/') === 0) {
            return path.replace('~/', `${ cwd }/src/`);
        }
    }
    return path;
}


export default ({ 'types': t }) => {
    const visitor = {
        CallExpression(path, state) {
            if (path.node.callee.name !== 'require') {
                return;
            }
    
            const args = path.node.arguments;
            if (!args.length) {
                return;
            }
    
            const firstArg = traverseExpression(t, args[0]);
    
            if (firstArg) {
                firstArg.value = replacePrefix(firstArg.value, state.opts, state.file.opts.filename);
            }
        },
        ImportDeclaration(path, state) {
            path.node.source.value = replacePrefix(path.node.source.value, state.opts, state.file.opts.filename);
        },
        ExportNamedDeclaration(path, state) {
            if (path.node.source) {
                path.node.source.value = replacePrefix(path.node.source.value, state.opts, state.file.opts.filename);
            }
        },
        ExportAllDeclaration(path, state) {
            if (path.node.source) {
                path.node.source.value = replacePrefix(path.node.source.value, state.opts, state.file.opts.filename);
            }
        }
    };

    return {
        'visitor': {
            Program(path, state) {
                path.traverse(visitor, state);
            }
        }
    };
}