/* @flow */

const name = 'firmwareUpdate';
const docs = 'methods/firmwareUpdate.md';

const list1Url = 'https://wallet.trezor.io/data/firmware/1/releases.json';
const list2Url = 'https://wallet.trezor.io/data/firmware/2/releases.json';
const fwBaseUrl = 'https://wallet.trezor.io';

export default [
    {
        url: `/method/firmwareUpdate`,
        name,
        // docs,
        submitButton: 'Firmware update',
        fields: [
            {
                name: 'payload',
                label: 'payload',
                optional: false,
                type: 'file',
            },
            {
                name: 'firmware',
                omit: true,
                type: 'select-async',
                value: '',
                affect: 'payload',
                data: [],
                fetchData: async () => {
                    const [response1, response2] = await Promise.all([
                        fetch(list1Url),
                        fetch(list2Url),
                    ])
                    const [list1, list2] = await Promise.all([
                        response1.json(),
                        response2.json(),
                    ])
                    return [...list1, ...list2].map((item) => ({value: item.url, label: item.version.join('.')}));
                },
                onSelect: async (value) => {
                    const response = await fetch(`${fwBaseUrl}/${value}`);
                    const data = await response.arrayBuffer();
                    return data;
                }
            },
        ]
    },
]