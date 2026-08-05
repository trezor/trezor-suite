/* eslint-disable react-hooks/rules-of-hooks */
import { type Getter } from './toGetter';
import { useGetter } from './useGetter';

type AllowPrereleaseDep = { getAllowPrerelease: Getter<[], boolean> };
type SelectedWalletDep = { getIsSelectedWallet: Getter<[walletDescriptor: string], boolean> };
type TwoGettersDep = AllowPrereleaseDep & { getLanguage: Getter<[], string> };
type PlainServiceDep = { reportSecurityCheck: () => void };

const selectAllowPrereleaseDep = (services: any): AllowPrereleaseDep => ({
    getAllowPrerelease: services.getAllowPrerelease,
});
const selectSelectedWalletDep = (services: any): SelectedWalletDep => ({
    getIsSelectedWallet: services.getIsSelectedWallet,
});
const selectTwoGettersDep = (services: any): TwoGettersDep => ({
    getAllowPrerelease: services.getAllowPrerelease,
    getLanguage: services.getLanguage,
});
const selectPlainServiceDep = (services: any): PlainServiceDep => ({
    reportSecurityCheck: services.reportSecurityCheck,
});

// The getter's value, no aliasing needed.
const _allowPrerelease: boolean = useGetter(selectAllowPrereleaseDep);

// A getter with params takes them after the dependency selector.
const _isSelectedWallet: boolean = useGetter(selectSelectedWalletDep, 'wallet-1');

// @ts-expect-error the params of the selected getter are type-checked
useGetter(selectSelectedWalletDep, 42);

// @ts-expect-error a getter without params takes no extra arguments
useGetter(selectAllowPrereleaseDep, 'wallet-1');

// @ts-expect-error a getter with params cannot be read without them
useGetter(selectSelectedWalletDep);

// @ts-expect-error the value type comes from the selected getter
const _wrongValueType: string = useGetter(selectAllowPrereleaseDep);

// @ts-expect-error which of the two getters would be read is ambiguous
const _twoGetters: boolean = useGetter(selectTwoGettersDep);

// @ts-expect-error plain services are not getters, they belong to useServices
const _plainService: () => void = useGetter(selectPlainServiceDep);

void _allowPrerelease;
void _isSelectedWallet;
void _wrongValueType;
void _twoGetters;
void _plainService;
