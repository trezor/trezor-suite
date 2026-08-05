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

// @ts-expect-error useGetter takes a single dependency selector, nothing else
useGetter(selectAllowPrereleaseDep, selectTwoGettersDep);

// @ts-expect-error a getter taking params cannot be read, there is nowhere to pass them
const _isSelectedWallet: boolean = useGetter(selectSelectedWalletDep);

// @ts-expect-error which of the two getters would be read is ambiguous
const _twoGetters: boolean = useGetter(selectTwoGettersDep);

// @ts-expect-error plain services are not getters, they belong to useServices
const _plainService: () => void = useGetter(selectPlainServiceDep);

void _allowPrerelease;
void _isSelectedWallet;
void _twoGetters;
void _plainService;
