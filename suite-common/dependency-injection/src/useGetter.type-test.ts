/* eslint-disable react-hooks/rules-of-hooks */
import { type Getter } from './toGetter';
import { useGetter } from './useGetter';

type AllowPrereleaseDep = { getAllowPrerelease: Getter<[], boolean> };
type SelectedWalletDep = { getIsSelectedWallet: Getter<[walletDescriptor: string], boolean> };
type TwoGettersDep = AllowPrereleaseDep & { getLanguage: Getter<[], string> };
type PlainServiceDep = { reportSecurityCheck: () => void };

const injectAllowPrerelease = (services: any): AllowPrereleaseDep => ({
    getAllowPrerelease: services.getAllowPrerelease,
});
const injectSelectedWallet = (services: any): SelectedWalletDep => ({
    getIsSelectedWallet: services.getIsSelectedWallet,
});
const injectTwoGetters = (services: any): TwoGettersDep => ({
    getAllowPrerelease: services.getAllowPrerelease,
    getLanguage: services.getLanguage,
});
const injectPlainService = (services: any): PlainServiceDep => ({
    reportSecurityCheck: services.reportSecurityCheck,
});

// The getter's value, no aliasing needed.
const _allowPrerelease: boolean = useGetter(injectAllowPrerelease);

// A getter with params takes them after the dependency injector.
const _isSelectedWallet: boolean = useGetter(injectSelectedWallet, 'wallet-1');

// @ts-expect-error the params of the selected getter are type-checked
useGetter(injectSelectedWallet, 42);

// @ts-expect-error a getter without params takes no extra arguments
useGetter(injectAllowPrerelease, 'wallet-1');

// @ts-expect-error a getter with params cannot be read without them
useGetter(injectSelectedWallet);

// @ts-expect-error the value type comes from the selected getter
const _wrongValueType: string = useGetter(injectAllowPrerelease);

// @ts-expect-error which of the two getters would be read is ambiguous
const _twoGetters: boolean = useGetter(injectTwoGetters);

// @ts-expect-error plain services are not getters, they belong to useServices
const _plainService: () => void = useGetter(injectPlainService);

void _allowPrerelease;
void _isSelectedWallet;
void _wrongValueType;
void _twoGetters;
void _plainService;
