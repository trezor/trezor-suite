/* eslint-disable react-hooks/rules-of-hooks */
import { useServices } from './useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };

const selectADep = (services: any): ADep => ({ a: services.a });
const selectBDep = (services: any): BDep => ({ b: services.b });

const _selectedServices: ADep & BDep = useServices(selectADep, selectBDep);

// @ts-expect-error useServices requires at least one selector.
useServices();

// @ts-expect-error useServices infers its return type from selectors.
useServices<BDep>();

// @ts-expect-error useServices returns type as narrow as the supplied selectors
const _mismatchedService: ADep = useServices(selectBDep);

void _selectedServices;
void _mismatchedService;
