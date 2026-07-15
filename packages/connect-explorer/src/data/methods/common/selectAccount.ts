import { allCoinsSelect } from '../../../constants/coins';

const name = 'selectAccount';

const coin = {
    name: 'coin',
    type: 'select',
    value: 'eth',
    data: allCoinsSelect,
};

const selectionTypeOptions = [
    { value: 'single', label: 'single' },
    { value: 'multi', label: 'multi' },
];

const addressSelection = {
    name: 'addressSelection',
    type: 'select',
    optional: true,
    value: 'fullAccount',
    data: [
        { value: 'fullAccount', label: 'fullAccount' },
        { value: 'firstFresh', label: 'firstFresh' },
        { value: 'manual', label: 'manual' },
    ],
};

const requireOnDeviceVerification = {
    name: 'requireOnDeviceVerification',
    type: 'checkbox',
    value: true,
};

export default [
    {
        name,
        submitButton: 'Select account',
        fields: [
            coin,
            { name: 'selectionType', type: 'select', value: 'single', data: selectionTypeOptions },
            addressSelection,
            requireOnDeviceVerification,
        ],
    },
    {
        name,
        submitButton: 'Select multiple accounts',
        fields: [
            coin,
            { name: 'selectionType', type: 'select', value: 'multi', data: selectionTypeOptions },
            addressSelection,
            requireOnDeviceVerification,
        ],
    },
];
