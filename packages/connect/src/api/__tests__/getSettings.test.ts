import * as enabledNetworksStore from '../../data/enabledNetworksStore';
import * as settingsStore from '../../data/settingsStore';
import GetSettings from '../getSettings';

// getSettings reads from settingsStore but overlays the dedicated enabledNetworksStore so the
// live, sanitized set is what callers see. Constructing the method is enough — run() is sync.
const makeGetSettings = () => new GetSettings({ payload: { method: 'getSettings' } } as any);

describe('GetSettings.run', () => {
    afterEach(() => {
        enabledNetworksStore.set([]);
    });

    it('merges the live enabledNetworks set into the returned settings', async () => {
        settingsStore.set({ enabledNetworks: undefined } as any);
        enabledNetworksStore.set([{ coin: 'ada' }, { coin: 'btc' }]);

        const result = await makeGetSettings().run();

        expect(result.enabledNetworks).toEqual(
            expect.arrayContaining([{ coin: 'ada' }, { coin: 'btc' }]),
        );
    });

    it("overrides any enabledNetworks left on settingsStore with the store's live set", async () => {
        // init strips enabledNetworks out of settingsStore, but assert the overlay wins regardless.
        settingsStore.set({ enabledNetworks: [{ coin: 'eth' }] } as any);
        enabledNetworksStore.set([{ coin: 'ada' }]);

        const result = await makeGetSettings().run();

        expect(result.enabledNetworks).toEqual([{ coin: 'ada' }]);
    });
});
