const path = require("path");
const SRC_PATH = path.join(__dirname, '../src');
const STORIES_PATH = path.join(__dirname, '../stories');

module.exports = ({
  config
}) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    include: [SRC_PATH, STORIES_PATH],
    use: [{
      loader: require.resolve('awesome-typescript-loader'),
      options: {
        errorsAsWarnings: true,
        configFileName: './.storybook/tsconfig.json'
      }
    }]
  });
  config.resolve.alias = {
    components: path.join(SRC_PATH, 'components'),
    config: path.join(SRC_PATH, 'config'),
    utils: path.join(SRC_PATH, 'utils')
  }
  config.resolve.extensions.push('.ts', '.tsx', '.js');
  return config;
};