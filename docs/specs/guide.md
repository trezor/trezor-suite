# Suite Guide Tech spec

**Feature Spec:** [Notion](https://www.notion.so/satoshilabs/Product-guide-394602e300cd46639233df53f31ed715?d=40dfec81-588d-4492-b108-1468861e450f), **Design:** [Zeplin](https://zpl.io/aBzxkDq), **Prototype**: [Figma](https://www.figma.com/proto/PVqDKfI5VvzbCJ5kheBPfS/Learn-and-Discover?page-id=0%3A1&node-id=1%3A30&viewport=672%2C292%2C0.12598536908626556&scaling=min-zoom), **Issue:** [GitHub](https://github.com/trezor/trezor-suite/issues/3713)

## MVP

The [Feature spec](https://www.notion.so/satoshilabs/Product-guide-394602e300cd46639233df53f31ed715?d=40dfec81-588d-4492-b108-1468861e450f) provides good description of what we're trying to build here. We agreed with @matejzak that the MVP we will ship in the official release will be scoped down on some of the features. Basically, Suite Guide will be a GUI with articles consisting of written content organised in a tree. Only the leafs of the tree will hold content i.e. a category can't have content in itself. These features are explicitly out of scope of the first release:
- "on this screen" button and other links between Suite and the content.
- full text search
- GitBook specific tags (eg. page links, tips, videos...). Only the markdown formatting will be supported.

They're still considered in the technical design to be easily implemented later. Refer to the **Future Work** section below to see how they'll fit in.

## Tech Spec

### Editing

As @tsusanka proposed we'll use GitBook (GB) to manage the content. We expect content editors to be non-developers and to operate independently of the dev team. GB gives them nice[1] WYSIWYG editing experience. The editors will be in charge of the content itself as well as of the tree structure.

GB has three ways of organising content:
- **Variants**: *intended*[2] to track more variants of the same content. Map to git branches. The conventional means of localisation in GB.
- **Groups**: can only be top-level i.e. cannot be nested. Map to directories in git repo.
- **Pages**: the actual pages can be nested indefinitely. Map to files (`page-title.md`) if they have no children or directories with a README.md file (`page-title/README.md`) when they do.

We won't use variants as branches would be cumbersome to integrate with Suite for two branches cannot be checked out at the same time. Instead, we'll use **groups** for localisation and then page nesting for content structure. This will result in intuitive GUI in GB dashboard as groups and hence locales are visually distinct from (even nested) pages.

If needed, we can use top-level pages (outside any group/locale) for meta information — the guide for guide writers.

### Takeaways for the content editors
- Make sure that the *slugs* of pages are identical across all locales. Slugs are used to name the folders and files in GB mirrors. The titles can still be localised freely. We need this to be able to refer to any particular page regardless of its locale. Such locale-agnostic references will be requried in Suite code base, for example for the "on this screen" feature.
- Do not write content in pages that have children. Any such content will be ignored. Only leaf pages will be rendered.
- Don't use any other GB elements than these unless we implement them which won't happen in the initial release.
    ![obrazek](https://user-images.githubusercontent.com/16712262/117797589-77aebc00-b250-11eb-8d92-31c37bf83803.png)

### Integration with Suite

We assume following requirements for integrating the content in Suite for the MVP:
- The content should be packaged with Suite to be accessible offline in desktop app.
- A particular revision of the content should be packed with Suite. That revision should be controlled from Suite codebase. I.e. developers must be able to choose which version of the content to include in any given build of Suite.
- Fetching and preparing the content should be automatically handled by the build system (yarn).

GB can expose all the content as a file tree available in a GitHub repository. We'll refer to this repository as _GB mirror_. Suite already contains the [suite-data](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-data) package which manages other similar external resources.

We'll add another 'module' to `suite-data` whose job will be to fetch content from the GB mirror and prepare it for packaging. This module will be invoked with the `build-libs` yarn script. This is inline with other data workflows already in place and adds no additional steps for CI or developers.

#### Fetching

The script will be configured with a commit ref from the GB mirror. It will then simply checkout the repository into a temporary directory and continue with...

#### Preparing

The MD files fetched from GB mirror can't be directly displayed on the screen. First, we need to chew them up. We aim to do majority of the work on build time to not waste clients' resources and to catch any discrepancies early. Preparation will consist of the following steps

1. **Indexing**: We assume the tree should be identical across all locales and that English is the canonical locale. When a page isn't available in a locale we'll display its English version. Pages not available in English shouldn't be considered at all. 
Traverse the content of English group/locale and build an in-memory tree of categories and pages. Ignore non-leaf pages. Search for corresponding pages in other locales and warn if any are missing. Build an object of the following shape and serialise it as JSON. This JSON will be used at runtime to render the Guide UI.
```js
{
    revision: '<commit sha of the content>',
    // The root of the content tree. Probably won't be rendered in itself - the rendering will start with its children.
    content: {
        type: 'category',
        // ID of the category or page and its path in the GB mirror at the same time.
        id: 'guide',
        // The root locales will always be all the locales (groups) existing in GB.
        // Further down the tree content might not be available in all locales.
        locales: ['en', 'cs'],
        title: {
            en: 'Suite Guide',
            cs: 'Suite Guide'
        },
        children: [
            // A page holding an actual content which is reachable by its id.
            {
                type: 'page',
                id: 'suite-guide/example-top-level-page-title',
                locales: ['en', 'cs'],
                title: {
                    en: 'Example top-level page title',
                    cs: 'Tak treba nadpis'
                }
            },
            // A sub-category only holding more pages (or sub-sub-categories).
            {
                type: 'category',
                id: 'suite-guide/example-category-title',
                locales: ['en', 'cs'],
                title: {
                    en: 'Example category title',
                    cs: 'Nadpis Kategorie'
                },
                children: [
                    // A page only available in english.
                    {
                        type: 'page',
                        id: 'suite-guide/example-category-title/example-page-title',
                        locales: ['en'],
                        title: {
                            en: 'Example top-level page title',
                        }
                    }
                ]
            }
        ]
    }
}
```
2. **Transpilation:** Take the indexed MD files and transpile them to HTML. Doing this at build time saves us from fetching and running markdown compiler in runtime.
3. **Sanitisation**: Sanitise the generated HTML of any content potentially vulnerable to XSS. Although the content should be managed by trusted editors better be safe than sorry.
4. **Bundling**: Take the JSON index, sanitised HTML files and assets and expose them in the `/public` directory of the Suite app. From there it's easy to use them to render the UI.

#### Usage

On run time, fetch the JSON index and render UI according to it. When displaying any given page first check if it's available in current locale or fallback to english. Then, fetch the html from the page's path prepended by the locale and mount it into the DOM. Apply styles to visually blend the content into the rest of the app.

## Future Work

Though the initial release won't contain these features we should account for them in the technical design. Here's how they'll fit in the setup I outlined above.

### Full-text Search

Because we have no backend for Suite we have to implement it on the client. There are several ready-made full-text search engines that can run in browser (and node). For us, the important capability is to be able to build an index at build time and then load it at runtime. Otherwise we'd have to fetch *all* pages prior serving a search query. That would be especially problematic in the web environment. Building the full-text index should nicely fit into the preparation pipeline. For example Elasticlunr provides means of [extracting]([http://elasticlunr.com/docs/index.js.html#toJSON](http://elasticlunr.com/docs/index.js.html#toJSON)) and [loading]([http://elasticlunr.com/docs/index.js.html#load](http://elasticlunr.com/docs/index.js.html#load)) its index. However more than 5 minutes (I spent) should be spent on selecting the right library to do this job.

### Linking the Content with the App

On one hand we expect Suite to be able to refer from itself to a specific page in the Guide Eg. *"Read more info"* buttons in tooltips, or the *"On this screen"* button in the Guide. Ideally, we want to validate these references at build time. This could be done by using the generated JSON index in the typescript compilation. Similarly to how we compile-time validate the translation IDs.

On the other hand we expect the content to be able to refer to specific parts of the app. Imagine an article about coins containing a link that would open the coin selection setting. I imagine we could leverage the deep links that are being worked on in [https://github.com/trezor/trezor-suite/issues/991](https://github.com/trezor/trezor-suite/issues/991). 

### GitBook Specific Content

Not all content that GitBook's WYSIWYG editor generates can be expressed natively in markdown. For example the [hint](https://docs.gitbook.com/editing-content/rich-content/with-command-palette#hints-and-callouts) element is rendered as `{% hint style="info" %} A hint! {% endhint %}` custom markdown tag. We can support these by extending the used MD compiler. For example Marked seems to be quite [extensible]([https://marked.js.org/using_pro](https://marked.js.org/using_pro)).

---

[1] Web based, intuitive, with team management.
[2] Though, it doesn't ensure the same content exists across all variants!
