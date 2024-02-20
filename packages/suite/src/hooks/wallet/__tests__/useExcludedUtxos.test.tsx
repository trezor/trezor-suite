import { useRef, useState, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { testMocks } from '@suite-common/test-utils';
import { useExcludedUtxos } from '../form/useExcludedUtxos';
import * as walletUtils from '@suite-common/wallet-utils';

type Props = Parameters<typeof useExcludedUtxos>[0];

const ACCOUNT = testMocks.getWalletAccount({
    addresses: {
        change: [],
        used: [],
        unused: [],
        anonymitySet: { AA01: 1, AA02: 10 },
    },
    utxo: [
        testMocks.getUtxo({
            amount: '1000',
            address: 'AA01',
            txid: '0000000000000000000000000000000000000000000000000000000000000001',
            vout: 1,
        }),
        testMocks.getUtxo({
            amount: '1000',
            address: 'AA02',
            txid: '0000000000000000000000000000000000000000000000000000000000000002',
            vout: 2,
        }),
    ],
});

const CJ_ACCOUNT: any = {
    targetAnonymity: 10,
};

const PROPS: Props = {
    account: ACCOUNT,
    dustLimit: testMocks.fee.dustLimit,
    targetAnonymity: CJ_ACCOUNT.targetAnonymity,
};

const initialProps = (): Props => JSON.parse(JSON.stringify(PROPS));

const Component = (props: Props) => {
    const excludedUtxos = useExcludedUtxos(props);
    const renderCount = useRef(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        renderCount.current++;
        setCount(renderCount.current);
    }, [excludedUtxos]);

    return (
        <div>
            <div data-testid="renders">{count}</div>
            {Object.keys(excludedUtxos).map(key => (
                <div key={key} data-testid="utxo">
                    {excludedUtxos[key]}
                </div>
            ))}
        </div>
    );
};

const getRenders = () => Number(screen.getByTestId('renders').innerHTML);

// mock getExcludedUtxos so we can count calls
jest.mock('@suite-common/wallet-utils', () => {
    const originalModule = jest.requireActual('@suite-common/wallet-utils');

    return {
        __esModule: true,
        ...originalModule,
        getExcludedUtxos: jest.fn((...args: any[]) => originalModule.getExcludedUtxos(...args)),
    };
});

describe('useExcludedUtxos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('changing account props', () => {
        const props = initialProps();
        if (!props.account.addresses) throw new Error('invalid props');

        const { unmount, rerender } = render(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(1);
        expect(screen.getAllByTestId('utxo').length).toBe(1);
        expect(getRenders()).toBe(1);

        props.account.utxo = [
            ...props.account.utxo!,
            testMocks.getUtxo({
                amount: '1000',
                address: 'AA03',
                txid: '0000000000000000000000000000000000000000000000000000000000000003',
                vout: 3,
            }),
        ];

        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(2);
        expect(screen.getAllByTestId('utxo').length).toBe(2);
        expect(getRenders()).toBe(2);

        props.account.addresses.anonymitySet = { AA01: 10, AA02: 10, AA03: 10 };
        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(3);
        expect(getRenders()).toBe(3);
        expect(() => screen.getAllByTestId('utxo')).toThrow('Unable to find an element');

        delete props.account.addresses.anonymitySet;
        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(4);
        expect(getRenders()).toBe(4);
        expect(screen.getAllByTestId('utxo').length).toBe(3); // default anonymitySet is used

        props.account.balance = '1000';
        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(4); // changing balance should not trigger calculation
        expect(getRenders()).toBe(4);

        unmount();
    });

    it('changing target anonymity', () => {
        const props = initialProps();
        if (!props.targetAnonymity) throw new Error('invalid props');

        const { unmount, rerender } = render(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(1);
        expect(screen.getAllByText('low-anonymity').length).toBe(1);
        expect(getRenders()).toBe(1);

        props.targetAnonymity = 1;
        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(2);
        expect(getRenders()).toBe(2);
        expect(() => screen.getAllByTestId('utxo')).toThrow('Unable to find an element');

        unmount();
    });

    it('changing dust limit', () => {
        const props = initialProps();

        props.dustLimit = 20000;

        const { unmount, rerender } = render(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(1);
        expect(getRenders()).toBe(1);
        expect(screen.getAllByText('dust').length).toBe(2);

        props.dustLimit = 100;
        rerender(<Component {...props} />);
        expect(walletUtils.getExcludedUtxos).toHaveBeenCalledTimes(2);
        expect(getRenders()).toBe(2);
        expect(() => screen.getAllByText('dust')).toThrow('Unable to find an element');

        unmount();
    });
});
