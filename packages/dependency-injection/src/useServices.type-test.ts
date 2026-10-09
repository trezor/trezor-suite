/* eslint-disable react-hooks/rules-of-hooks */
import { type Getter } from './toGetter';
import { useServices } from './useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };
type GetterDep = { getSomething: Getter<[], boolean> };

const injectA = (services: any): ADep => ({ a: services.a });
const injectB = (services: any): BDep => ({ b: services.b });
const injectGetter = (services: any): GetterDep => ({ getSomething: services.getSomething });

const _selectedServices: ADep & BDep = useServices(injectA, injectB);

// @ts-expect-error useServices requires at least one selector.
useServices();

// @ts-expect-error useServices infers its return type from selectors.
useServices<BDep>();

// @ts-expect-error useServices returns type as narrow as the supplied selectors
const _mismatchedService: ADep = useServices(injectB);

// @ts-expect-error getters must be read with useGetter, so useServices does not hand them out
const { getSomething: _getSomething } = useServices(injectGetter);

// @ts-expect-error one getter among plain services is rejected as well
const _mixedServices: ADep & GetterDep = useServices(injectA, injectGetter);

void _selectedServices;
void _mismatchedService;
void _getSomething;
void _mixedServices;
