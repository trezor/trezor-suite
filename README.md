# Trezor Ethereum wallet

To install dependencies run `npm install` or `yarn`

To start locally run `npm run dev` or `yarn run dev`

To build the project run `npm run build` or `yarn run build`

======================================

## Project structure
The project is divided into two parts - data that are used when compiling the project and data that aren't.

All data that are used during compilation are stored inside the `src/` folder.

### `src/` folder
At the root of the `src/` folder are all files or folders that are shared.

- `src/index.js` - root of the application
- `src/views/` - contains all React `components` and `views`
- `src/store/` - todo
- `src/actions/` - todo
- `src/reducers/` - todo
- todo other folders/files?


## Component
Component is what you'd intuitively think it is. It's a regular React component (doesn't matter whether statefull or stateless).

### **Global components**
All global components are are stored in `src/views/components/` folder.
Global components are such components that are shared across multiple different components or views.
- For example there's a `Button` component that is used in both `ConnectDevice` and `AccountSend`. `ConnectDevice` and `AccountSend` are both placed accross different views so the `Button` component they're both using must be stored in the global `components` folder.

### **Naming & structure convention**
Each component has it's own folder. Name of the folder is same as is the name of the component (camel case and first letter is capitalized, e.g.: *MyComponent*).

If you want to create multiple components of the same type you should put them into a common folder with a lowercase name like this `views/componets/type/MyComponent`.

- For example there are different types of modals like `confirm` or `device`.
Because the `confirm` and `device` modals are subtypes of modal the folder structure looks like this
    ```
    modals/confirm/Address
    modals/confirm/SignTx
    modals/device/Duplicate
    ```
    Where `Address`, `SignTx` and `Duplicate` are the actual modal components.

Inside each component's folder is `index.js` file containing the actual component's code with following export at the end of the file `export default ComponentName;`

There's only one render function per component's index file. If you need more renders you should probably create new component.

Each component may contain other components in its own `components/` folder. Component's components may contain another components etc.


## View
The difference between `view` and `component` is rather semantical then technical.

From the React's standpoint a view is just another component. So when is component a regular component and when is it a view?
View components basically copy router structure and are composed either from view's own components or global components.

### **Naming & structure convention**
Both naming and structure conventions are similar to components conventions.
Each view has its own folder in `views/` folder. Name of this folder is same as is the view's name (camel case and first letter is capitalized, e.g.: *MyView*).
Inside the view's folder is always an `index.js` file containing view's code itself.

View may contain own components inside view's folder - in the `components/` folder. One of the differences between a component and a view is that view can hav another views. Of course those views may have their own components and views, etc.

```
views/
    MyView/
            components/
            views/
            index.js
    MyAnotherView/
            components/
            index.js
```

- For example there's a `Landing` component that is displayed if no device is detected. This view contains its own components in a `Landing/components/` folder. These components are then used exclusively in `Landing/index.js` and together compose different versions of the `Landing` view.

<!-- If you aren't sure whether you should create component or view follow this discussion
- If the route has following structure `/nameA/nameB/...` then `nameA` is probably a view and `nameB` is its subview
- If the route has following structure `/nameA/:parameter/nameB/...` then `nameA` is a view
    - If the are some elements -->





