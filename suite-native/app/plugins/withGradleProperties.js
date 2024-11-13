const { withGradleProperties } = require('expo/config-plugins');

const newGraddleProperties = [];

module.exports = config =>
    withGradleProperties(config, config2 => {
        newGraddleProperties.map(gradleProperty => {
            const isPropertyAlreadySet = config2.modResults.some(
                item => item.key === gradleProperty.key,
            );

            if (!isPropertyAlreadySet) {
                // push empty line to separate properties
                config2.modResults.push({
                    type: 'empty',
                });
                config2.modResults.push(gradleProperty);
            }

            return config2.modResults;
        });

        return config2;
    });
