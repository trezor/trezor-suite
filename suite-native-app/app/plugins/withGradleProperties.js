const { withGradleProperties } = require('expo/config-plugins');

// Increases Gradle JVM memory to prevent OOM errors during Detox CI builds
const newGradleProperties = [
    { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m' },
];

module.exports = config =>
    withGradleProperties(config, config2 => {
        newGradleProperties.forEach(gradleProperty => {
            const existingProp = config2.modResults.find(item => item.key === gradleProperty.key);

            if (existingProp) {
                existingProp.value = gradleProperty.value;
            } else {
                config2.modResults.push({ type: 'empty' });
                config2.modResults.push(gradleProperty);
            }
        });

        return config2;
    });
