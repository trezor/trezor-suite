const { withGradleProperties, withProjectBuildGradle } = require('expo/config-plugins');

const newGradleProperties = [
    // Increases Gradle JVM memory to prevent OOM errors during Detox CI builds.
    { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m' },
    { type: 'property', key: 'org.gradle.workers.max', value: '2' },
    { type: 'property', key: 'org.gradle.parallel', value: 'false' },
];

const gradleConfiguration =
    "apply from: new File(rootDir, '../plugins/androidBuildWorkers.gradle')";

module.exports = config => {
    const configWithGradleProperties = withGradleProperties(config, config2 => {
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

    return withProjectBuildGradle(configWithGradleProperties, config2 => {
        if (!config2.modResults.contents.includes(gradleConfiguration)) {
            config2.modResults.contents += `\n${gradleConfiguration}\n`;
        }

        return config2;
    });
};
