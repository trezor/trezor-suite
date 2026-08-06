/* eslint-disable react-hooks/rules-of-hooks */
import { type Getter } from './toGetter';
import { useServices } from './useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };
type GetterDep = { getSomething: Getter<[], boolean> };

const selectADep = (services: any): ADep => ({ a: services.a });
const selectBDep = (services: any): BDep => ({ b: services.b });
const selectGetterDep = (services: any): GetterDep => ({ getSomething: services.getSomething });

const _selectedServices: ADep & BDep = useServices(selectADep, selectBDep);

// @ts-expect-error useServices requires at least one selector.
useServices();

// @ts-expect-error useServices infers its return type from selectors.
useServices<BDep>();

// @ts-expect-error useServices returns type as narrow as the supplied selectors
const _mismatchedService: ADep = useServices(selectBDep);

// @ts-expect-error getters must be read with useGetter, so useServices does not hand them out
const { getSomething: _getSomething } = useServices(selectGetterDep);

// @ts-expect-error one getter among plain services is rejected as well
const _mixedServices: ADep & GetterDep = useServices(selectADep, selectGetterDep);

void _selectedServices;
void _mismatchedService;
void _getSomething;
void _mixedServices;
