import { selectServices } from './useServices';

const services = {
    a: jest.fn(),
    b: jest.fn(),
};

type SelectedServices = {
    a: typeof services.a;
    b: typeof services.b;
};

const selectADep = (currentServices: any) => ({
    a: currentServices.a,
});

const selectBDep = (currentServices: any) => ({
    b: currentServices.b,
});

describe(selectServices.name, () => {
    it('selects and merges a subset of nested services', () => {
        const selectedServices: SelectedServices = selectServices(services, selectADep, selectBDep);

        expect(selectedServices.a).toBe(services.a);
        expect(selectedServices.b).toBe(services.b);
    });
});
