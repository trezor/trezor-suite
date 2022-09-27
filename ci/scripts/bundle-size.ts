console.log('hello');

import fetch from 'node-fetch';

const suiteProjectId = '14570634';
const artifactPath = 'latest-linux.yml';
const jobName = 'suite-desktop build linux';

const devBundleUrl = encodeURI(
    `https://gitlab.com/api/v4/projects/${suiteProjectId}/jobs/artifacts/develop/raw/${artifactPath}?job=${jobName}`,
);
const currentBundleUrl = encodeURI(
    `https://gitlab.com/api/v4/projects/${suiteProjectId}/jobs/artifacts/${process.env.CI_BUILD_REF_NAME}/raw/${artifactPath}?job=${jobName}`,
);

const getBundleSize = async (url: string) => {
    const bundleInfoResp = await fetch(url);
    if (bundleInfoResp.status !== 200) {
        throw new Error(bundleInfoResp.statusText);
    }
    return bundleInfoResp.text();
};

const getSize = (yml: string) => {
    const regexp = /size: \d+/;
    const match = regexp.exec(yml);

    if (!match) {
        throw new Error('could not parse yaml file');
    }
    return match[0].replace('size: ', '');
};

const run = async () => {
    const devBundleInfo = await getBundleSize(devBundleUrl);
    const currentBundleInfo = await getBundleSize(currentBundleUrl);

    const devSize = getSize(devBundleInfo);
    const currentBundleSize = getSize(currentBundleInfo);

    console.log('dev bundle size: ', devSize);
    console.log('current bundle size', currentBundleSize);
};

run();
