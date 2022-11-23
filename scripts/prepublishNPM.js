console.log(
    `Publish only from CI!
DO NOT USE npm publish, use yarn npm publish instead! npm publish does not handle workspace ranges - see https://yarnpkg.com/features/workspaces#publishing-workspaces`,
);
process.exit(1);
