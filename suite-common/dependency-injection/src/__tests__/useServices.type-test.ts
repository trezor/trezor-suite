/* eslint-disable react-hooks/rules-of-hooks */
import { useServices } from '../useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };

const selectADep = (services: any): ADep => ({ a: services.a });
const selectBDep = (services: any): BDep => ({ b: services.b });

const _selectedServices: ADep & BDep = useServices(selectADep, selectBDep);
const _allServices: BDep = useServices<BDep>();

// @ts-expect-error useServices requires an explicit generic type argument.
useServices();

void _selectedServices;
void _allServices;
