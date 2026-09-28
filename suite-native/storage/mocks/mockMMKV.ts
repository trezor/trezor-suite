import { type MMKV } from 'react-native-mmkv';

import { mock, mockNotExpected } from '@suite-common/dependency-injection';

type MMKVValue = Parameters<MMKV['set']>[1];

export const mockMMKV = (overrides: Partial<MMKV> = {}): MMKV => {
    const values = new Map<string, MMKVValue>();

    return {
        id: 'mock-mmkv',
        name: 'MMKV',
        length: 0,
        size: 0,
        byteSize: 0,
        isReadOnly: false,
        isEncrypted: true,
        set: mock<MMKV['set']>((key, value) => {
            values.set(key, value);
        }),
        getString: mock<MMKV['getString']>(key => {
            const value = values.get(key);

            return typeof value === 'string' ? value : undefined;
        }),
        remove: mock<MMKV['remove']>(key => values.delete(key)),
        getBoolean: mockNotExpected<MMKV['getBoolean']>('getBoolean'),
        getNumber: mockNotExpected<MMKV['getNumber']>('getNumber'),
        getBuffer: mockNotExpected<MMKV['getBuffer']>('getBuffer'),
        contains: mockNotExpected<MMKV['contains']>('contains'),
        getAllKeys: mockNotExpected<MMKV['getAllKeys']>('getAllKeys'),
        clearAll: mockNotExpected<MMKV['clearAll']>('clearAll'),
        recrypt: mockNotExpected<MMKV['recrypt']>('recrypt'),
        encrypt: mockNotExpected<MMKV['encrypt']>('encrypt'),
        decrypt: mockNotExpected<MMKV['decrypt']>('decrypt'),
        trim: mockNotExpected<MMKV['trim']>('trim'),
        checkContentChanged: mockNotExpected<MMKV['checkContentChanged']>('checkContentChanged'),
        addOnValueChangedListener: mockNotExpected<MMKV['addOnValueChangedListener']>(
            'addOnValueChangedListener',
        ),
        importAllFrom: mockNotExpected<MMKV['importAllFrom']>('importAllFrom'),
        toString: mockNotExpected<MMKV['toString']>('toString'),
        equals: mockNotExpected<MMKV['equals']>('equals'),
        dispose: mockNotExpected<MMKV['dispose']>('dispose'),
        ...overrides,
    };
};
