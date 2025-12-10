# Jazz (react)

## Getting started

### Overview
# Learn some Jazz 

**Jazz is a new kind of database** that's **distributed** across your frontend, containers, serverless functions and its own storage cloud.

It syncs structured data, files and LLM streams instantly, and looks like local reactive JSON state.

It also provides auth, orgs & teams, real-time multiplayer, edit histories, permissions, E2E encryption and offline-support out of the box.

---

## Quickstart

**Want to learn the basics?** Check out our [quickstart guide](/docs/quickstart) for a step-by-step guide to building a simple app with Jazz.

**Just want to get started?** You can use [create-jazz-app](/docs/tooling-and-resources/create-jazz-app) to create a new Jazz project from one of our starter templates or example apps:

```sh
  npx create-jazz-app@latest --api-key you@example.com

```

**Using an LLM?** [Add our llms.txt](/react/llms-full.txt) to your context window!

**Info:** 

Requires at least Node.js v20\. See our [Troubleshooting Guide](/docs/troubleshooting) for quick fixes.

## How it works

1. **Define your data** with CoValues schemas
2. **Connect to storage infrastructure** (Jazz Cloud or self-hosted)
3. **Create and edit CoValues** like normal objects
4. **Get automatic sync and persistence** across all devices and users

Your UI updates instantly on every change, everywhere. It's like having reactive local state that happens to be shared with the world.

## Ready to see Jazz in action?

Have a look at our [example apps](/examples) for inspiration and to see what's possible with Jazz. From real-time chat and collaborative editors to file sharing and social features — these are just the beginning of what you can build.

## Core concepts

Learn how to structure your data using [collaborative values](/docs/core-concepts/covalues/overview) — the building blocks that make Jazz apps work.

## Sync and storage

Sync and persist your data by setting up [sync and storage infrastructure](/docs/core-concepts/sync-and-storage) using Jazz Cloud, or host it yourself.

## Going deeper

Get better results with AI by [importing the Jazz docs](/docs/tooling-and-resources/ai-tools) into your context window.

If you have any questions or need assistance, please don't hesitate to reach out to us on [Discord](https://discord.gg/utDMjHYg42). We'd love to help you get started.


### Quickstart
# Get started with Jazz  in 10 minutes

This quickstart guide will take you from an empty project to a working app with a simple data model and components to create and display your data.

## Create your App

We'll be using Next.js for this guide per the [React team's recommendation](https://react.dev/learn/creating-a-react-app), but Jazz works great with vanilla React and other full-stack frameworks too.

You can accept the defaults for all the questions, or customise the project as you like.

```sh
npx create-next-app@latest --typescript jazzfest
cd jazzfest

```

**Note: Requires Node.js 20+**

## Install Jazz

The `jazz-tools` package includes everything you're going to need to build your first Jazz app.

```sh
npm install jazz-tools

```

## Get your free API key

Sign up for a free API key at [dashboard.jazz.tools](https://dashboard.jazz.tools) for higher limits or production use, or use your email address as a temporary key to get started quickly.

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY="you@example.com" # or your API key

```

## Define your schema

Jazz uses Zod for more simple data types (like strings, numbers, booleans), and its own schemas to create collaborative data structures known as CoValues. CoValues are automatically persisted across your devices and the cloud and synced in real-time. Here we're defining a schema made up of both Zod types and CoValues.

Adding a `root` to the user's account gives us a container that can be used to keep a track of all the data a user might need to use the app. The migration runs when the user logs in, and ensures the account is properly set up before we try to use it.

**File name: app/schema.ts**

```ts
import { co, z } from "jazz-tools";

export const Band = co.map({
  name: z.string(), // Zod primitive type
});

export const Festival = co.list(Band);

export const JazzFestAccountRoot = co.map({
  myFestival: Festival,
});

export const JazzFestAccount = co
  .account({
    root: JazzFestAccountRoot,
    profile: co.profile(),
  })
  .withMigration((account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        myFestival: [],
      });
    }
  });

```

## Add the Jazz Provider

Wrap your app with a provider so components can use Jazz.

**File name: app/components/JazzWrapper.tsx**

```tsx
"use client"; // tells Next.js that this component can't be server-side rendered. If you're not using Next.js, you can remove it.
import { JazzReactProvider } from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export function JazzWrapper({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
      }}
      AccountSchema={JazzFestAccount}
    >
      {children}
    </JazzReactProvider>
  );
}

```

**File name: app/layout.tsx**

```tsx
import { JazzWrapper } from "@/app/components/JazzWrapper";

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
  <html lang="en">
    <body>
      <JazzWrapper>{children}</JazzWrapper>
    </body>
  </html>
);
}

```

## Start your app

Moment of truth — time to start your app and see if it works.

```bash
npm run dev

```

If everything's going according to plan, you should see the default Next.js welcome page!

### Not loading?

If you're not seeing the welcome page:

* Check you wrapped your app with the Jazz Provider in `app/layout.tsx`
* Check your schema is properly defined in `app/schema.ts`

**Info: Still stuck?** Ask for help on [Discord](https://discord.gg/utDMjHYg42)!

## Create data

Let's create a simple form to add a new band to the festival. We'll use the `useAccount` hook to get the current account and tell Jazz to load the `myFestival` CoValue by passing a `resolve` query.

**File name: app/components/NewBand.tsx**

```tsx
"use client";
import { useAccount } from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";
import { useState } from "react";

export function NewBand() {
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: true } },
  });
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!me.$isLoaded) return;
    me.root.myFestival.$jazz.push({ name });
    setName("");
  };

  return (
    <div>
      <input
        type="text"
        value={name}
        placeholder="Band name"
        onChange={(e) => setName(e.target.value)}
      />
      <button type="button" onClick={handleSave}>
        Add
      </button>
    </div>
  );
}

```

## Display your data

Now we've got a way to create data, so let's add a component to display it.

**File name: app/components/Festival.tsx**

```tsx
"use client";
import { useAccount } from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";

export function Festival() {
  const me = useAccount(JazzFestAccount, {
    resolve: {
      root: {
        myFestival: {
          $each: true
        }
      }
    },
  });
  if (!me.$isLoaded) return null;
  return (
    <ul>
      {me.root.myFestival.map(
        (band) => band && <li key={band.$jazz.id}>{band.name}</li>,
      )}
    </ul>
  );
}

```

## Put it all together

You've built all your components, time to put them together.

**File name: app/page.tsx**

```tsx
import { Festival } from "@/app/components/Festival";
import { NewBand } from "@/app/components/NewBand";

export default function Home() {
  return (
    <main>
      <h1>🎪 My Festival</h1>
      <NewBand />
      <Festival />
    </main>
  );
}

```

You should now be able to add a band to your festival, and see it appear in the list!

**Congratulations! 🎉** You've built your first Jazz app!

You've begun to scratch the surface of what's possible with Jazz. Behind the scenes, your local-first JazzFest app is **already** securely syncing your data to the cloud in real-time, ready for you to build more and more powerful features.

Psst! Got a few more minutes and want to add Server Side Rendering to your app? [We've got you covered!](/docs/server-side/ssr)

## Next steps

* [Add authentication](/docs/key-features/authentication/quickstart) to your app so that you can log in and view your data wherever you are!
* Dive deeper into the collaborative data structures we call [CoValues](/docs/core-concepts/covalues/overview)
* Learn how to share and [collaborate on data](/docs/permissions-and-sharing/overview) using groups and permissions
* Complete the [server-side quickstart](/docs/server-side/quickstart) to learn more about Jazz on the server


### Installation
# Providers

`<JazzReactProvider />` is the core component that connects your React application to Jazz. It handles:

* **Data Synchronization**: Manages connections to peers and the Jazz cloud
* **Local Storage**: Persists data locally between app sessions
* **Schema Types**: Provides APIs for the [AccountSchema](/docs/core-concepts/schemas/accounts-and-migrations)
* **Authentication**: Connects your authentication system to Jazz

Our [Chat example app](https://jazz.tools/examples#chat) provides a complete implementation of JazzReactProvider with authentication and real-time data sync.

## Setting up the Provider

The provider accepts several configuration options:

```tsx
import { JazzReactProvider } from "jazz-tools/react";
import { MyAppAccount } from "./schema";

export function MyApp({ children }: { children: React.ReactNode }) {
return (
  <JazzReactProvider
    sync={{
      peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
      when: "always", // When to sync: "always", "never", or "signedUp"
    }}
    AccountSchema={MyAppAccount}
  >
    {children}
  </JazzReactProvider>
);
}

```

**Info: Tip** 

Sign up for a free API key at [dashboard.jazz.tools](https://dashboard.jazz.tools) for higher limits or production use, or use your email address as a temporary key to get started quickly.

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY="you@example.com" # or your API key

```

## Provider Options

### Sync Options

The `sync` property configures how your application connects to the Jazz network:

```ts
import { type SyncConfig } from "jazz-tools";

export const syncConfig: SyncConfig = {
// Connection to Jazz Cloud or your own sync server
peer: `wss://cloud.jazz.tools/?key=${apiKey}`,

// When to sync: "always" (default), "never", or "signedUp"
when: "always",
};

```

See [Authentication States](/docs/key-features/authentication/authentication-states#controlling-sync-for-different-authentication-states) for more details on how the `when` property affects synchronization based on authentication state.

### Account Schema

The `AccountSchema` property defines your application's account structure:

```tsx
import { JazzReactProvider } from "jazz-tools/react";
import { MyAppAccount } from "./schema";

export function MyApp({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        when: "always", // When to sync: "always", "never", or "signedUp"
      }}
      AccountSchema={MyAppAccount}
    >
      {children}
    </JazzReactProvider>
  );
}

```

### Additional Options

The provider accepts these additional options:

```tsx
export function MyApp({ children }: { children: React.ReactNode }) {
return (
  <JazzReactProvider
    sync={syncConfig}
    // Enable guest mode for account-less access
    guestMode={false}
    // Enable SSR mode
    enableSSR={false}
    // Set default name for new user profiles
    defaultProfileName="New User"
    // Override the default storage key
    authSecretStorageKey="jazz-logged-in-secret"
    // Handle user logout
    onLogOut={() => {
      console.log("User logged out");
    }}
    // Handle anonymous account data when user logs in to existing account
    onAnonymousAccountDiscarded={(account) => {
      console.log("Anonymous account discarded", account.$jazz.id);
      // Migrate data here
      return Promise.resolve();
    }}
  >
    {children}
  </JazzReactProvider>
);
}

```

See [Authentication States](/docs/key-features/authentication/authentication-states) for more information on authentication states, guest mode, and handling anonymous accounts.

## Authentication

The Jazz Provider works with various authentication methods to enable users to access their data across multiple devices. For a complete guide to authentication, see our [Authentication Overview](/docs/key-features/authentication/overview).

## Need Help?

If you have questions about configuring the Jazz Provider for your specific use case, [join our Discord community](https://discord.gg/utDMjHYg42) for help.


### Troubleshooting
# Setup troubleshooting

A few reported setup hiccups and how to fix them.

---

## Node.js version requirements

Jazz requires **Node.js v20 or later** due to native module dependencies.  
Check your version:

```sh
node -v

```

If you’re on Node 18 or earlier, upgrade via nvm:

```sh
nvm install 20
nvm use 20

```

---

### Required TypeScript Configuration

In order to build successfully with TypeScript, you must ensure that you have the following options configured (either in your `tsconfig.json` or using the command line):

* `skipLibCheck` must be `true`
* `exactOptionalPropertyTypes` must be `false`

---

## npx jazz-run: command not found

If, when running:

```sh
npx jazz-run sync

```

you encounter:

```sh
sh: jazz-run: command not found

```

This is often due to an npx cache quirk. (For most apps using Jazz)

1. Clear your npx cache:

```sh
npx clear-npx-cache

```

1. Rerun the command:

```sh
npx jazz-run sync

```

---

### Node 18 workaround (rebuilding the native module)

If you can’t upgrade to Node 20+, you can rebuild the native `better-sqlite3` module for your architecture.

1. Install `jazz-run` locally in your project:

```sh
pnpm add -D jazz-run

```

1. Find the installed version of better-sqlite3 inside node\_modules. It should look like this:

```sh
./node_modules/.pnpm/better-sqlite3{version}/node_modules/better-sqlite3

```

Replace `{version}` with your installed version and run:

```sh
# Navigate to the installed module and rebuild
pushd ./node_modules/.pnpm/better-sqlite3{version}/node_modules/better-sqlite3
&& pnpm install
&& popd

```

If you get ModuleNotFoundError: No module named 'distutils': Linux:

```sh
pip install --upgrade setuptools

```

macOS:

```sh
brew install python-setuptools

```

_Workaround originally shared by @aheissenberger on Jun 24, 2025._

---

### Still having trouble?

If none of the above fixes work:

Make sure dependencies installed without errors (`pnpm install`).

Double-check your `node -v` output matches the required version.

Open an issue on GitHub with:

* Your OS and version
* Node.js version
* Steps you ran and full error output

We're always happy to help! If you're stuck, reachout via [Discord](https://discord.gg/utDMjHYg42)


## Upgrade guides

### 0.19.0 - Explicit loading states


### 0.18.0 - New `$jazz` field in CoValues


### 0.17.0 - New image APIs


### 0.16.0 - Cleaner separation between Zod and CoValue schemas


### 0.15.0 - Everything inside `jazz-tools`


### 0.14.0 - Zod-based schemas


## Core Concepts

### Overview
# Defining schemas: CoValues

**CoValues ("Collaborative Values") are the core abstraction of Jazz.** They're your bread-and-butter datastructures that you use to represent everything in your app.

As their name suggests, CoValues are inherently collaborative, meaning **multiple users and devices can edit them at the same time.**

**Think of CoValues as "super-fast Git for lots of tiny data."**

* CoValues keep their full edit histories, from which they derive their "current state".
* The fact that this happens in an eventually-consistent way makes them [CRDTs](https://en.wikipedia.org/wiki/Conflict-free%5Freplicated%5Fdata%5Ftype).
* Having the full history also means that you often don't need explicit timestamps and author info - you get this for free as part of a CoValue's [edit metadata](/docs/key-features/history).

CoValues model JSON with CoMaps and CoLists, but also offer CoFeeds for simple per-user value feeds, and let you represent binary data with FileStreams.

## Start your app with a schema

Fundamentally, CoValues are as dynamic and flexible as JSON, but in Jazz you use them by defining fixed schemas to describe the shape of data in your app.

This helps correctness and development speed, but is particularly important...

* when you evolve your app and need migrations
* when different clients and server workers collaborate on CoValues and need to make compatible changes

Thinking about the shape of your data is also a great first step to model your app.

Even before you know the details of how your app will work, you'll probably know which kinds of objects it will deal with, and how they relate to each other.

In Jazz, you define schemas using `co` for CoValues and `z` (from [Zod](https://zod.dev/)) for their primitive fields.

**File name: schema.ts**

```ts
import { co, z } from "jazz-tools";

export const TodoProject = co.map({
  title: z.string(),
  tasks: ListOfTasks,
});

```

This gives us schema info that is available for type inference _and_ at runtime.

Check out the inferred type of `project` in the example below, as well as the input `.create()` expects.

```ts
import { Group } from "jazz-tools";
import { TodoProject, ListOfTasks } from "./schema";

const project = TodoProject.create(
  {
    title: "New Project",
    tasks: ListOfTasks.create([], Group.create()),
  },
  Group.create(),
);

```

When creating CoValues that contain other CoValues, you can pass in a plain JSON object. Jazz will automatically create the CoValues for you.

```ts
const group = Group.create().makePublic();
const publicProject = TodoProject.create(
  {
    title: "New Project",
    tasks: [], // Permissions are inherited, so the tasks list will also be public
  },
  group,
);

```

**Info:** 

To learn more about how permissions work when creating nested CoValues with plain JSON objects, refer to [Ownership on implicit CoValue creation](/docs/permissions-and-sharing/cascading-permissions#ownership-on-implicit-covalue-creation).

## Types of CoValues

### `CoMap` (declaration)

CoMaps are the most commonly used type of CoValue. They are the equivalent of JSON objects (Collaborative editing follows a last-write-wins strategy per-key).

You can either declare struct-like CoMaps:

```ts
export const Task = co.map({
  title: z.string(),
  completed: z.boolean(),
});

```

Or record-like CoMaps (key-value pairs, where keys are always `string`):

```ts
export const ColourToHex = co.record(z.string(), z.string());
export const ColorToFruit = co.record(z.string(), Fruit);

```

See the corresponding sections for [creating](/docs/core-concepts/covalues/comaps#creating-comaps),[subscribing/loading](/docs/core-concepts/subscription-and-loading),[reading from](/docs/core-concepts/covalues/comaps#reading-from-comaps) and[updating](/docs/core-concepts/covalues/comaps#updating-comaps) CoMaps.

### `CoList` (declaration)

CoLists are ordered lists and are the equivalent of JSON arrays. (They support concurrent insertions and deletions, maintaining a consistent order.)

You define them by specifying the type of the items they contain:

```ts
export const ListOfColors = co.list(z.string());
export const ListOfTasks = co.list(Task);

```

See the corresponding sections for [creating](/docs/core-concepts/covalues/colists#creating-colists),[subscribing/loading](/docs/core-concepts/subscription-and-loading),[reading from](/docs/core-concepts/covalues/colists#reading-from-colists) and[updating](/docs/core-concepts/covalues/colists#updating-colists) CoLists.

### `CoFeed` (declaration)

CoFeeds are a special CoValue type that represent a feed of values for a set of users/sessions (Each session of a user gets its own append-only feed).

They allow easy access of the latest or all items belonging to a user or their sessions. This makes them particularly useful for user presence, reactions, notifications, etc.

You define them by specifying the type of feed item:

```ts
export const FeedOfTasks = co.feed(Task);

```

See the corresponding sections for [creating](/docs/core-concepts/covalues/overview#creating-cofeeds),[subscribing/loading](/docs/core-concepts/subscription-and-loading),[reading from](/docs/core-concepts/covalues/cofeeds#reading-from-cofeeds) and[writing to](/docs/core-concepts/covalues/cofeeds#writing-to-cofeeds) CoFeeds.

### `FileStream` (declaration)

FileStreams are a special type of CoValue that represent binary data. (They are created by a single user and offer no internal collaboration.)

They allow you to upload and reference files.

You typically don't need to declare or extend them yourself, you simply refer to the built-in `co.fileStream()` from another CoValue:

```ts
export const Document = co.map({
  title: z.string(),
  file: co.fileStream(),
});

```

See the corresponding sections for [creating](/docs/core-concepts/covalues/filestreams#creating-filestreams),[subscribing/loading](/docs/core-concepts/subscription-and-loading),[reading from](/docs/core-concepts/covalues/filestreams#reading-from-filestreams) and[writing to](/docs/core-concepts/covalues/filestreams#writing-to-filestreams) FileStreams.

**Note: For images, we have a special, higher-level `co.image()` helper, see [ImageDefinition](/docs/core-concepts/covalues/imagedef).**

### Unions of CoMaps (declaration)

You can declare unions of CoMaps that have discriminating fields, using `co.discriminatedUnion()`.

```ts
export const ButtonWidget = co.map({
  type: z.literal("button"),
  label: z.string(),
});

export const SliderWidget = co.map({
  type: z.literal("slider"),
  min: z.number(),
  max: z.number(),
});

export const WidgetUnion = co.discriminatedUnion("type", [
  ButtonWidget,
  SliderWidget,
]);

```

See the corresponding sections for [creating](/docs/core-concepts/schemas/schemaunions#creating-schema-unions),[subscribing/loading](/docs/core-concepts/subscription-and-loading) and[narrowing](/docs/core-concepts/schemas/schemaunions#narrowing-unions) schema unions.

## CoValue field/item types

Now that we've seen the different types of CoValues, let's see more precisely how we declare the fields or items they contain.

### Primitive fields

You can declare primitive field types using `z` (re-exported in `jazz-tools` from [Zod](https://zod.dev/)).

Here's a quick overview of the primitive types you can use:

```ts
z.string(); // For simple strings
z.number(); // For numbers
z.boolean(); // For booleans
z.date(); // For dates
z.literal(["waiting", "ready"]); // For enums

```

Finally, for more complex JSON data, that you _don't want to be collaborative internally_ (but only ever update as a whole), you can use more complex Zod types.

For example, you can use `z.object()` to represent an internally immutable position:

```ts
const Sprite = co.map({
  // assigned as a whole
  position: z.object({ x: z.number(), y: z.number() }),
});

```

Or you could use a `z.tuple()`:

```ts
const SpriteWithTuple = co.map({
  // assigned as a whole
  position: z.tuple([z.number(), z.number()]),
});

```

### References to other CoValues

To represent complex structured data with Jazz, you form trees or graphs of CoValues that reference each other.

Internally, this is represented by storing the IDs of the referenced CoValues in the corresponding fields, but Jazz abstracts this away, making it look like nested CoValues you can get or assign/insert.

The important caveat here is that **a referenced CoValue might or might not be loaded yet,** but we'll see what exactly that means in [Subscribing and Deep Loading](/docs/core-concepts/subscription-and-loading).

In Schemas, you declare references by just using the schema of the referenced CoValue:

```ts
const Person = co.map({
  name: z.string(),
});

const ListOfPeople = co.list(Person);

const Company = co.map({
  members: ListOfPeople,
});

```

#### Optional References

You can make schema fields optional using either `z.optional()` or `co.optional()`, depending on the type of value:

* Use `z.optional()` for primitive Zod values like `z.string()`, `z.number()`, or `z.boolean()`
* Use `co.optional()` for CoValues like `co.map()`, `co.list()`, or `co.record()`

You can make references optional with `co.optional()`:

```ts
const PersonWithOptionalProperties = co.map({
  age: z.optional(z.number()), // primitive
  pet: co.optional(Pet), // CoValue
});

```

#### Recursive References

You can wrap references in getters. This allows you to defer evaluation until the property is accessed. This technique is particularly useful for defining circular references, including recursive (self-referencing) schemas, or mutually recursive schemas.

```ts
const SelfReferencingPerson = co.map({
  name: z.string(),
  get bestFriend() {
    return Person;
  },
});

```

You can use the same technique for mutually recursive references:

```ts
const MutuallyRecursivePerson = co.map({
  name: z.string(),
  get friends() {
    return ListOfFriends;
  },
});

const ListOfFriends = co.list(Person);

```

If you try to reference `ListOfPeople` in `Person` without using a getter, you'll run into a `ReferenceError` because of the [temporal dead zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal%5Fdead%5Fzone%5Ftdz).

### Helper methods

If you find yourself repeating the same logic to access computed CoValues properties, you can define helper functions to encapsulate it for better reusability:

```ts
const Person = co.map({
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date(),
});
type Person = co.loaded<typeof Person>;

export function getPersonFullName(person: Person) {
  return `${person.firstName} ${person.lastName}`;
}

function differenceInYears(date1: Date, date2: Date) {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25));
}

export function getPersonAgeAsOf(person: Person, date: Date) {
  return differenceInYears(date, person.dateOfBirth);
}

const person = Person.create({
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1990-01-01"),
});

const fullName = getPersonFullName(person);
const age = getPersonAgeAsOf(person, new Date());

```

Similarly, you can encapsulate logic needed to update CoValues:

```ts
export function updatePersonName(person: Person, fullName: string) {
  const [firstName, lastName] = fullName.split(" ");
  person.$jazz.set("firstName", firstName);
  person.$jazz.set("lastName", lastName);
}

console.log(person.firstName, person.lastName); // John Doe

updatePersonName(person, "Jane Doe");

console.log(person.firstName, person.lastName); // Jane Doe

```


### CoMaps
# CoMaps

CoMaps are key-value objects that work like JavaScript objects. You can access properties with dot notation and define typed fields that provide TypeScript safety. They're ideal for structured data that needs type validation.

## Creating CoMaps

CoMaps are typically defined with `co.map()` and specifying primitive fields using `z` (see [Defining schemas: CoValues](/docs/core-concepts/covalues/overview) for more details on primitive fields):

```ts
import { co, z } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
  coordinator: co.optional(Member),
});
export type Project = co.loaded<typeof Project>;
export type ProjectInitShape = co.input<typeof Project>; // type accepted by `Project.create`

```

You can create either struct-like CoMaps with fixed fields (as above) or record-like CoMaps for key-value pairs:

```ts
const Inventory = co.record(z.string(), z.number());

```

To instantiate a CoMap:

```ts
const project = Project.create({
  name: "Spring Planting",
  startDate: new Date("2025-03-15"),
  status: "planning",
});

const inventory = Inventory.create({
  tomatoes: 48,
  basil: 12,
});

```

### Ownership

When creating CoMaps, you can specify ownership to control access:

```ts
// Create with default owner (current user)
const privateProject = Project.create({
  name: "My Herb Garden",
  startDate: new Date("2025-04-01"),
  status: "planning",
});

// Create with shared ownership
const gardenGroup = Group.create();
gardenGroup.addMember(memberAccount, "writer");

const communityProject = Project.create(
  {
    name: "Community Vegetable Plot",
    startDate: new Date("2025-03-20"),
    status: "planning",
  },
  { owner: gardenGroup },
);

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to CoMaps.

## Reading from CoMaps

CoMaps can be accessed using familiar JavaScript object notation:

```ts
console.log(project.name); // "Spring Planting"
console.log(project.status); // "planning"

```

### Handling Optional Fields

Optional fields require checks before access:

```ts
if (project.coordinator) {
  console.log(project.coordinator.name); // Safe access
}

```

### Recursive references

You can wrap references in getters. This allows you to defer evaluation until the property is accessed. This technique is particularly useful for defining circular references, including recursive (self-referencing) schemas, or mutually recursive schemas.

```ts
import { co, z } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
  coordinator: co.optional(Member),
  get subProject() {
    return Project.optional();
  },
});

export type Project = co.loaded<typeof Project>;

```

When the recursive references involve more complex types, it is sometimes required to specify the getter return type:

```ts
const ProjectWithTypedGetter = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
  coordinator: co.optional(Member),
  // [!code ++:3]
  get subProjects(): co.Optional<co.List<typeof Project>> {
    return co.optional(co.list(Project));
  },
});

export type Project = co.loaded<typeof Project>;

```

### Partial

For convenience Jazz provies a dedicated API for making all the properties of a CoMap optional:

```ts
const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
});

const ProjectDraft = Project.partial();

// The fields are all optional now
const project = ProjectDraft.create({});

```

### Pick

You can also pick specific fields from a CoMap:

```ts
const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  status: z.literal(["planning", "active", "completed"]),
});

const ProjectStep1 = Project.pick({
  name: true,
  startDate: true,
});

// We don't provide the status field
const project = ProjectStep1.create({
  name: "My project",
  startDate: new Date("2025-04-01"),
});

```

### Working with Record CoMaps

For record-type CoMaps, you can access values using bracket notation:

```ts
const inventory = Inventory.create({
  tomatoes: 48,
  peppers: 24,
  basil: 12,
});

console.log(inventory["tomatoes"]); // 48

```

## Updating CoMaps

To update a CoMap's properties, use the `$jazz.set` method:

```ts
project.$jazz.set("name", "Spring Vegetable Garden"); // Update name
project.$jazz.set("startDate", new Date("2025-03-20")); // Update date

```

**Info:** 

The `$jazz` namespace is available on all CoValues, and provides access to methods to modify and load CoValues, as well as access common properties like `id` and `owner`.

When updating references to other CoValues, you can provide both the new CoValue or a JSON object from which the new CoValue will be created.

```ts
const Dog = co.map({
  name: co.plainText(),
});
const Person = co.map({
  name: co.plainText(),
  dog: Dog,
});

const person = Person.create({
  name: "John",
  dog: { name: "Rex" },
});

// Update the dog field using a CoValue
person.$jazz.set("dog", Dog.create({ name: co.plainText().create("Fido") }));
// Or use a plain JSON object
person.$jazz.set("dog", { name: "Fido" });

```

When providing a JSON object, Jazz will automatically create the CoValues for you. To learn more about how permissions work in this case, refer to[Ownership on implicit CoValue creation](/docs/permissions-and-sharing/cascading-permissions#ownership-on-implicit-covalue-creation).

### Type Safety

CoMaps are fully typed in TypeScript, giving you autocomplete and error checking:

```ts
project.$jazz.set("name", "Spring Vegetable Planting"); // ✓ Valid string
// [!code --]
project.$jazz.set("startDate", "2025-03-15"); // ✗ Type error: expected Date
// [!code --]
// Argument of type 'string' is not assignable to parameter of type 'Date'

```

### Soft Deletion

Implementing a soft deletion pattern by using a `deleted` flag allows you to maintain data for potential recovery and auditing.

```ts
const Project = co.map({
  name: z.string(),
  // [!code ++]
  deleted: z.optional(z.boolean()),
});

```

When an object needs to be "deleted", instead of removing it from the system, the deleted flag is set to true. This gives us a property to omit it in the future.

### Deleting Properties

You can delete properties from CoMaps:

```ts
inventory.$jazz.delete("basil"); // Remove a key-value pair

// For optional fields in struct-like CoMaps
project.$jazz.set("coordinator", undefined); // Remove the reference

```

## Running migrations on CoMaps

Migrations are functions that run when a CoMap is loaded, allowing you to update existing data to match new schema versions. Use them when you need to modify the structure of CoMaps that already exist in your app. Unlike [Account migrations](/docs/core-concepts/schemas/accounts-and-migrations#when-migrations-run), CoMap migrations are not run when a CoMap is created.

**Note:** Migrations are run synchronously and cannot be run asynchronously.

Here's an example of a migration that adds the `priority` field to the `Task` CoMap:

```ts
const Task = co
  .map({
    done: z.boolean(),
    text: co.plainText(),
    version: z.literal([1, 2]),
    priority: z.enum(["low", "medium", "high"]), // new field
  })
  .withMigration((task) => {
    if (task.version === 1) {
      task.$jazz.set("priority", "medium");
      // Upgrade the version so the migration won't run again
      task.$jazz.set("version", 2);
    }
  });

```

### Migration best practices

Design your schema changes to be compatible with existing data:

* **Add, don't change:** Only add new fields; avoid renaming or changing types of existing fields
* **Make new fields optional:** This prevents errors when loading older data
* **Use version fields:** Track schema versions to run migrations only when needed

### Migration & reader permissions

Migrations need write access to modify CoMaps. If some users only have read permissions, they can't run migrations on those CoMaps.

**Forward-compatible schemas** (where new fields are optional) handle this gracefully - users can still use the app even if migrations haven't run.

**Non-compatible changes** require handling both schema versions in your app code using discriminated unions.

When you can't guarantee all users can run migrations, handle multiple schema versions explicitly:

```ts
const TaskV1 = co.map({
  version: z.literal(1),
  done: z.boolean(),
  text: z.string(),
});

const TaskV2 = co
  .map({
    // We need to be more strict about the version to make the
    // discriminated union work
    version: z.literal(2),
    done: z.boolean(),
    text: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })
  .withMigration((task) => {
    if (task.version === 1) {
      task.$jazz.set("version", 2);
      task.$jazz.set("priority", "medium");
    }
  });

// Export the discriminated union; because some users might
// not be able to run the migration
export const Task = co.discriminatedUnion("version", [TaskV1, TaskV2]);
export type Task = co.loaded<typeof Task>;

```

## Best Practices

### Structuring Data

* Use struct-like CoMaps for entities with fixed, known properties
* Use record-like CoMaps for dynamic key-value collections
* Group related properties into nested CoMaps for better organization

### Common Patterns

#### Helper methods

You should define helper methods of CoValue schemas separately, in standalone functions:

```ts
import { co, z } from "jazz-tools";

const Project = co.map({
  name: z.string(),
  startDate: z.date(),
  endDate: z.optional(z.date()),
});
type Project = co.loaded<typeof Project>;

export function isProjectActive(project: Project) {
  const now = new Date();
  return (
    now >= project.startDate && (!project.endDate || now <= project.endDate)
  );
}

export function formatProjectDuration(
  project: Project,
  format: "short" | "full",
) {
  const start = project.startDate.toLocaleDateString();
  if (!project.endDate) {
    return format === "full" ? `Started on ${start}, ongoing` : `From ${start}`;
  }

  const end = project.endDate.toLocaleDateString();
  return format === "full"
    ? `From ${start} to ${end}`
    : `${(project.endDate.getTime() - project.startDate.getTime()) / 86400000} days`;
}

const project = Project.create({
  name: "My project",
  startDate: new Date("2025-04-01"),
  endDate: new Date("2025-04-04"),
});

console.log(isProjectActive(project)); // false
console.log(formatProjectDuration(project, "short")); // "3 days"

```

#### Uniqueness

CoMaps are typically created with a CoValue ID that acts as an opaque UUID, by which you can then load them. However, there are situations where it is preferable to load CoMaps using a custom identifier:

* The CoMaps have user-generated identifiers, such as a slug
* The CoMaps have identifiers referring to equivalent data in an external system
* The CoMaps have human-readable & application-specific identifiers  
   * If an application has CoValues used by every user, referring to it by a unique _well-known_ name (eg, `"my-global-comap"`) can be more convenient than using a CoValue ID

Consider a scenario where one wants to identify a CoMap using some unique identifier that isn't the Jazz CoValue ID:

```ts
// This will not work as `learning-jazz` is not a CoValue ID
const myTask = await Task.load("learning-jazz");

```

To make it possible to use human-readable identifiers Jazz lets you to define a `unique` property on CoMaps.

Then the CoValue ID is deterministically derived from the `unique` property and the owner of the CoMap.

```ts
// Given the project owner, myTask will have always the same id
Task.create(
  {
    text: "Let's learn some Jazz!",
  },
  {
    unique: "learning-jazz",
    owner: project.$jazz.owner, // Different owner, different id
  },
);

```

Now you can use `CoMap.loadUnique` to easily load the CoMap using the human-readable identifier:

```ts
const learnJazzTask = await Task.loadUnique(
  "learning-jazz",
  project.$jazz.owner.$jazz.id,
);

```

It's also possible to combine the create+load operation using `CoMap.upsertUnique`:

```ts
await Task.upsertUnique({
  value: {
    text: "Let's learn some Jazz!",
  },
  unique: "learning-jazz",
  owner: project.$jazz.owner,
});

```

**Caveats:**

* The `unique` parameter acts as an _immutable_ identifier - i.e. the same `unique` parameter in the same `Group` will always refer to the same CoValue.  
   * To make dynamic renaming possible, you can create an indirection where a stable CoMap identified by a specific value of `unique` is simply a pointer to another CoMap with a normal, dynamic CoValue ID. This pointer can then be updated as desired by users with the corresponding permissions.
* This way of introducing identifiers allows for very fast lookup of individual CoMaps by identifier, but it doesn't let you enumerate all the CoMaps identified this way within a `Group`. If you also need enumeration, consider using a global `co.record()` that maps from identifier to a CoMap, which you then do lookups in (this requires at least a shallow load of the entire `co.record()`, but this should be fast for up to 10s of 1000s of entries)

#### Creating Set-like Collections

You can use CoRecords as a way to create set-like collections, by keying the CoRecord on the item's CoValue ID. You can then use static `Object` methods to iterate over the CoRecord, effectively allowing you to treat it as a set.

```ts
const Chat = co.map({
messages: co.list(Message),
participants: co.record(z.string(), MyAppUser),
});

const chat = await Chat.load(chatId, {
resolve: {
  participants: true,
},
});

let participantList: string[];

// Note that I don't need to load the map deeply to read and set keys
if (chat.$isLoaded) {
chat.participants.$jazz.set(me.$jazz.id, me);
participantList = Object.keys(chat.participants);
}

```

You can choose a loading strategy for the CoRecord. Use $each when you need all item properties to be immediately available. In general, it is enough to shallowly load a CoRecord to access its keys, and then load the values of those keys as needed (for example, by passing the keys as strings to a child component).

```ts
const { participants } = await chat.$jazz.ensureLoaded({
resolve: {
  participants: {
    $each: {
      profile: {
        avatar: true,
      },
    },
  },
},
});

const avatarList = Object.values(participants).map(
(user) => user.profile.avatar,
);

```


### CoLists
# CoLists

CoLists are ordered collections that work like JavaScript arrays. They provide indexed access, iteration methods, and length properties, making them perfect for managing sequences of items.

## Creating CoLists

CoLists are defined by specifying the type of items they contain:

```ts
import { co, z } from "jazz-tools";

const ListOfResources = co.list(z.string());
export type ListOfResources = co.loaded<typeof ListOfResources>;

const ListOfTasks = co.list(Task);
export type ListOfTasks = co.loaded<typeof ListOfTasks>;
export type ListOfTasksInitShape = co.input<typeof ListOfTasks>; // type accepted by `ListOfTasks.create`

```

To create a `CoList`:

```ts
// Create an empty list
const resources = co.list(z.string()).create([]);

// Create a list with initial items
const tasks = co.list(Task).create([
  { title: "Prepare soil beds", status: "in-progress" },
  { title: "Order compost", status: "todo" },
]);

```

### Ownership

Like other CoValues, you can specify ownership when creating CoLists.

```ts
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamList = co.list(Task).create([], { owner: teamGroup });

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to CoLists.

## Reading from CoLists

CoLists support standard array access patterns:

```ts
// Access by index
const firstTask = tasks[0];
console.log(firstTask.title); // "Prepare soil beds"

// Get list length
console.log(tasks.length); // 2

// Iteration
tasks.forEach((task) => {
  console.log(task.title);
  // "Prepare soil beds"
  // "Order compost"
});

// Array methods
const todoTasks = tasks.filter((task) => task.status === "todo");
console.log(todoTasks.length); // 1

```

## Updating CoLists

Methods to update a CoList's items are grouped inside the `$jazz` namespace:

```ts
// Add items
resources.$jazz.push("Tomatoes"); // Add to end
resources.$jazz.unshift("Lettuce"); // Add to beginning
tasks.$jazz.push({
  // Add complex items
  title: "Install irrigation", // (Jazz will create
  status: "todo", // the CoValue for you!)
});

// Replace items
resources.$jazz.set(0, "Cucumber"); // Replace by index

// Modify nested items
tasks[0].$jazz.set("status", "complete"); // Update properties of references

```

### Soft Deletion

You can do a soft deletion by using a deleted flag, then creating a helper method that explicitly filters out items where the deleted property is true.

```ts
const Task = co.map({
  title: z.string(),
  status: z.literal(["todo", "in-progress", "complete"]),
  deleted: z.optional(z.boolean()), // [!code ++]
});
type Task = typeof Task;

const ListOfTasks = co.list(Task);
type ListOfTasks = typeof ListOfTasks;

export function getCurrentTasks(list: co.loaded<ListOfTasks, { $each: true }>) {
  return list.filter((task): task is co.loaded<Task> => !task.deleted);
}

async function main() {
  const myTaskList = ListOfTasks.create([]);
  myTaskList.$jazz.push({
    title: "Tomatoes",
    status: "todo",
    deleted: false,
  });
  myTaskList.$jazz.push({
    title: "Cucumbers",
    status: "todo",
    deleted: true,
  });
  myTaskList.$jazz.push({
    title: "Carrots",
    status: "todo",
  });

  const activeTasks = getCurrentTasks(myTaskList);
  console.log(activeTasks.map((task) => task.title));
  // Output: ["Tomatoes", "Carrots"]
}

```

There are several benefits to soft deletions:

* **recoverablity** \- Nothing is truly deleted, so recovery is possible in the future
* **data integrity** \- Relationships can be maintained between current and deleted values
* **auditable** \- The data can still be accessed, good for audit trails and checking compliance

### Deleting Items

Jazz provides two methods to retain or remove items from a CoList:

```ts
// Remove items
resources.$jazz.remove(2); // By index
console.log(resources); // ["Cucumber", "Peppers"]
resources.$jazz.remove((item) => item === "Cucumber"); // Or by predicate
console.log(resources); // ["Tomatoes", "Peppers"]

// Keep only items matching the predicate
resources.$jazz.retain((item) => item !== "Cucumber");
console.log(resources); // ["Tomatoes", "Peppers"]

```

You can also remove specific items by index with `splice`, or remove the first or last item with `pop` or `shift`:

```ts
// Remove 2 items starting at index 1
resources.$jazz.splice(1, 2);
console.log(resources); // ["Tomatoes"]

// Remove a single item at index 0
resources.$jazz.splice(0, 1);
console.log(resources); // ["Cucumber", "Peppers"]

// Remove items
const lastItem = resources.$jazz.pop(); // Remove and return last item
resources.$jazz.shift(); // Remove first item

```

### Array Methods

`CoList`s support the standard JavaScript array methods you already know. Methods that mutate the array are grouped inside the `$jazz` namespace.

```ts
// Add multiple items at once
resources.$jazz.push("Tomatoes", "Basil", "Peppers");

// Find items
const basil = resources.find((r) => r === "Basil");

// Filter (returns regular array, not a CoList)
const tItems = resources.filter((r) => r.startsWith("T"));
console.log(tItems); // ["Tomatoes"]

```

### Type Safety

CoLists maintain type safety for their items:

```ts
// TypeScript catches type errors
resources.$jazz.push("Carrots"); // ✓ Valid string
// [!code --]
resources.$jazz.push(42); // ✗ Type error: expected string
// [!code --]
// Argument of type 'number' is not assignable to parameter of type 'string'
// For lists of references
tasks.forEach((task) => {
  console.log(task.title); // TypeScript knows task has title
});

```

## Best Practices

### Common Patterns

#### List Rendering

CoLists work well with UI rendering libraries:

```ts
import { co, z } from "jazz-tools";
const ListOfTasks = co.list(Task);

// React example
function TaskList({ tasks }: { tasks: co.loaded<typeof ListOfTasks> }) {
  return (
    <ul>
      {tasks.map((task) =>
        task.$isLoaded ? (
          <li key={task.$jazz.id}>
            {task.title} - {task.status}
          </li>
        ) : null,
      )}
    </ul>
  );
}

```

#### Managing Relations

CoLists can be used to create one-to-many relationships:

```ts
import { co, z } from "jazz-tools";

const Task = co.map({
  title: z.string(),
  status: z.literal(["todo", "in-progress", "complete"]),

  get project(): co.Optional<typeof Project> {
    return co.optional(Project);
  },
});

const ListOfTasks = co.list(Task);

const Project = co.map({
  name: z.string(),

  get tasks(): co.List<typeof Task> {
    return ListOfTasks;
  },
});

const project = Project.create({
  name: "Garden Project",
  tasks: ListOfTasks.create([]),
});

const task = Task.create({
  title: "Plant seedlings",
  status: "todo",
  project: project, // Add a reference to the project
});

// Add a task to a garden project
project.tasks.$jazz.push(task);

// Access the project from the task
console.log(task.project); // { name: "Garden Project", tasks: [task] }

```

#### Set-like Collections

CoLists, like JavaScript arrays, allow you to insert the same item multiple times. In some cases, you might want to have a collection of unique items (similar to a set). To achieve this, you can use a CoRecord with entries keyed on a unique identifier (for example, the CoValue ID).

You can read [more about this pattern here](/docs/core-concepts/covalues/comaps#creating-set-like-collections).


### CoFeeds
# CoFeeds

CoFeeds are append-only data structures that track entries from different user sessions and accounts. Unlike other CoValues where everyone edits the same data, CoFeeds maintain separate streams for each session.

Each account can have multiple sessions (different browser tabs, devices, or app instances), making CoFeeds ideal for building features like activity logs, presence indicators, and notification systems.

The following examples demonstrate a practical use of CoFeeds:

* [Multi-cursors](https://github.com/garden-co/jazz/tree/main/examples/multi-cursors) \- track user presence on a canvas with multiple cursors and out of bounds indicators
* [Reactions](https://github.com/garden-co/jazz/tree/main/examples/reactions) \- store per-user emoji reaction using a CoFeed

## Creating CoFeeds

CoFeeds are defined by specifying the type of items they'll contain, similar to how you define CoLists:

```ts
// Define a schema for feed items
const Activity = co.map({
  timestamp: z.date(),
  action: z.literal(["watering", "planting", "harvesting", "maintenance"]),
  notes: z.optional(z.string()),
});
export type Activity = co.loaded<typeof Activity>;

// Define a feed of garden activities
const ActivityFeed = co.feed(Activity);

// Create a feed instance
const activityFeed = ActivityFeed.create([]);

```

### Ownership

Like other CoValues, you can specify ownership when creating CoFeeds.

```ts
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");
const teamFeed = ActivityFeed.create([], { owner: teamGroup });

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to CoFeeds.

## Reading from CoFeeds

Since CoFeeds are made of entries from users over multiple sessions, you can access entries in different ways - from a specific user's session or from their account as a whole.

### Per-Session Access

To retrieve entries from a session:

```ts
// Get the feed for a specific session
const sessionFeed = activityFeed.perSession[sessionId];

// Latest entry from a session
if (sessionFeed?.value.$isLoaded) {
  console.log(sessionFeed.value.action); // "watering"
}

```

For convenience, you can also access the latest entry from the current session with `inCurrentSession`:

```ts
// Get the feed for the current session
const currentSessionFeed = activityFeed.inCurrentSession;

// Latest entry from the current session
if (currentSessionFeed?.value.$isLoaded) {
  console.log(currentSessionFeed.value.action); // "harvesting"
}

```

### Per-Account Access

To retrieve entries from a specific account (with entries from all sessions combined) use `perAccount`:

```ts
// Get the feed for a specific session
const accountFeed = activityFeed.perAccount[accountId];

// Latest entry from an account
if (accountFeed?.value.$isLoaded) {
  console.log(accountFeed.value.action); // "watering"
}

```

For convenience, you can also access the latest entry from the current account with `byMe`:

```ts
// Get the feed for the current account
const myLatestEntry = activityFeed.byMe;

// Latest entry from the current account
if (myLatestEntry?.value.$isLoaded) {
  console.log(myLatestEntry.value.action); // "harvesting"
}

```

### Feed Entries

#### All Entries

To retrieve all entries from a CoFeed:

```ts
// Get the feeds for a specific account and session
const accountFeed = activityFeed.perAccount[accountId];
const sessionFeed = activityFeed.perSession[sessionId];

// Iterate over all entries from the account
for (const entry of accountFeed.all) {
  if (entry.value.$isLoaded) {
    console.log(entry.value);
  }
}

// Iterate over all entries from the session
for (const entry of sessionFeed.all) {
  if (entry.value.$isLoaded) {
    console.log(entry.value);
  }
}

```

#### Latest Entry

To retrieve the latest entry from a CoFeed, ie. the last update:

```ts
// Get the latest entry from the current account
const latestEntry = activityFeed.byMe;

if (latestEntry?.value.$isLoaded) {
  console.log(`My last action was ${latestEntry?.value?.action}`);
  // "My last action was harvesting"
}

// Get the latest entry from each account
const latestEntriesByAccount = Object.values(activityFeed.perAccount).map(
  (entry) => ({
    accountName: entry.by?.profile.$isLoaded ? entry.by.profile.name : "Unknown",
    value: entry.value,
  }),
);

```

## Writing to CoFeeds

CoFeeds are append-only; you can add new items, but not modify existing ones. This creates a chronological record of events or activities.

### Adding Items

```ts
// Log a new activity
activityFeed.$jazz.push(
  Activity.create({
    timestamp: new Date(),
    action: "watering",
    notes: "Extra water for new seedlings",
  }),
);

```

Each item is automatically associated with the current user's session. You don't need to specify which session the item belongs to - Jazz handles this automatically.

### Understanding Session Context

Each entry is automatically added to the current session's feed. When a user has multiple open sessions (like both a mobile app and web browser), each session creates its own separate entries:

```ts
// On mobile device:
fromMobileFeed.$jazz.push(
  Activity.create({
    timestamp: new Date(),
    action: "harvesting",
    notes: "Vegetable patch",
  }),
);

// On web browser (same user):
fromBrowserFeed.$jazz.push(
  Activity.create({
    timestamp: new Date(),
    action: "planting",
    notes: "Flower bed",
  }),
);

// These are separate entries in the same feed, from the same account

```

## Metadata

CoFeeds support metadata, which is useful for tracking information about the feed itself.

### By

The `by` property is the account that made the entry.

```ts
Me
// Get the feed for the current account
const myLatestEntry = activityFeed.byMe;

// Latest entry from the current account
if (myLatestEntry?.value.$isLoaded) {
  console.log(myLatestEntry.value.action); // "harvesting"
}

```

### MadeAt

The `madeAt` property is a timestamp of when the entry was added to the feed.

```ts
const accountFeed = activityFeed.perAccount[accountId];

// Get the timestamp of the last update
console.log(accountFeed?.madeAt);

// Get the timestamp of each entry
for (const entry of accountFeed.all) {
  console.log(entry.madeAt);
}

```

## Best Practices

### When to Use CoFeeds

* **Use CoFeeds when**:  
   * You need to track per-user/per-session data  
   * Time-based information matters (activity logs, presence)
* **Consider alternatives when**:  
   * Data needs to be collaboratively edited (use CoMaps or CoLists)  
   * You need structured relationships (use CoMaps/CoLists with references)


### CoTexts
# CoTexts

Jazz provides two CoValue types for collaborative text editing, collectively referred to as "CoText" values:

* **`co.plainText()`** for simple text editing without formatting
* **`co.richText()`** for rich text with HTML-based formatting (extends `co.plainText()`)

Both types enable real-time collaborative editing of text content while maintaining consistency across multiple users.

**Note:** If you're looking for a quick way to add rich text editing to your app, check out [our prosemirror plugin](#using-rich-text-with-prosemirror).

```ts
const note = co.plainText().create("Meeting notes");

// Update the text
note.$jazz.applyDiff("Meeting notes for Tuesday");

console.log(note.toString()); // "Meeting notes for Tuesday"

```

For a full example of CoTexts in action, see [our Richtext example app](https://github.com/garden-co/jazz/tree/main/examples/richtext-prosemirror), which shows plain text and rich text editing.

## `co.plainText()` vs `z.string()`

While `z.string()` is perfect for simple text fields, `co.plainText()` is the right choice when you need:

* Frequent text edits that aren't just replacing the whole field
* Fine-grained control over text edits (inserting, deleting at specific positions)
* Multiple users editing the same text simultaneously
* Character-by-character collaboration
* Efficient merging of concurrent changes

Both support real-time updates, but `co.plainText()` provides specialized tools for collaborative editing scenarios.

## Creating CoText Values

CoText values are typically used as fields in your schemas:

```ts
const Profile = co.profile({
  name: z.string(),
  bio: co.plainText(), // Plain text field
  description: co.richText(), // Rich text with formatting
});

```

Create a CoText value with a simple string:

```ts
// Create plaintext with default ownership (current user)
const meetingNotes = co.plainText().create("Meeting notes");

// Create rich text with HTML content
const document = co
  .richText()
  .create("<p>Project <strong>overview</strong></p>");

```

### Ownership

Like other CoValues, you can specify ownership when creating CoTexts.

```ts
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamNote = co.plainText().create("Team updates", { owner: teamGroup });

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to CoText values.

## Reading Text

CoText values work similarly to JavaScript strings:

```ts
// Get the text content
console.log(note.toString()); // "Meeting notes"
console.log(`${note}`); // "Meeting notes"

// Check the text length
console.log(note.length); // 14

```

When using CoTexts in JSX, you can read the text directly:

```tsx
<>
  <p>{note.toString()}</p>
  <p>{note}</p>
</>;

```

## Making Edits

Insert and delete text with intuitive methods:

```ts
// Insert text at a specific position
note.insertBefore(8, "weekly "); // "Meeting weekly notes"

// Insert after a position
note.insertAfter(21, " for Monday"); // "Meeting weekly notes for Monday"

// Delete a range of text
note.deleteRange({ from: 8, to: 15 }); // "Meeting notes for Monday"

// Apply a diff to update the entire text
note.$jazz.applyDiff("Team meeting notes for Tuesday");

```

### Applying Diffs

Use `applyDiff` to efficiently update text with minimal changes:

```ts
// Original text: "Team status update"
const minutes = co.plainText().create("Team status update");

// Replace the entire text with a new version
minutes.$jazz.applyDiff("Weekly team status update for Project X");

// Make partial changes
let text = minutes.toString();
text = text.replace("Weekly", "Monday");
minutes.$jazz.applyDiff(text); // Efficiently updates only what changed

```

Perfect for handling user input in form controls:

```ts
function TextEditor({ textId }: { textId: string }) {
  const note = useCoState(co.plainText(), textId);

  return (
    note.$isLoaded && (
      <textarea
        value={note.toString()}
        onChange={(e) => {
          // Efficiently update only what the user changed
          note.$jazz.applyDiff(e.target.value);
        }}
      />
    )
  );
}

```

## Using Rich Text with ProseMirror

Jazz provides a dedicated plugin for integrating `co.richText()` with the popular ProseMirror editor that enables bidirectional synchronization between your co.richText() instances and ProseMirror editors.

### ProseMirror Plugin Features

* **Bidirectional Sync**: Changes in the editor automatically update the `co.richText()` and vice versa
* **Real-time Collaboration**: Multiple users can edit the same document simultaneously
* **HTML Conversion**: Automatically converts between HTML (used by `co.richText()`) and ProseMirror's document model

### Installation

```bash
pnpm add prosemirror-view \
  prosemirror-state \
  prosemirror-schema-basic

```

### Integration

For use with React:

```tsx
function RichTextEditor() {
  const me = useAccount(JazzAccount, { resolve: { profile: { bio: true } } });
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const bio = me.$isLoaded ? me.profile.bio : undefined;

  useEffect(() => {
    if (!bio || !editorRef.current) return;
    // Create the Jazz plugin for ProseMirror
    // Providing a co.richText() instance to the plugin to automatically sync changes
    const jazzPlugin = createJazzPlugin(bio); // [!code ++]

    // Set up ProseMirror with the Jazz plugin
    if (!viewRef.current) {
      viewRef.current = new EditorView(editorRef.current, {
        state: EditorState.create({
          schema,
          plugins: [
            ...exampleSetup({ schema }),
            jazzPlugin, // [!code ++]
          ],
        }),
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [bio?.$jazz.id]);

  if (!me.$isLoaded) return null;

  return (
    <div className="rounded border">
      <div ref={editorRef} className="p-2" />
    </div>
  );
}

```


### FileStreams
# FileStreams

FileStreams handle binary data in Jazz applications - think documents, audio files, and other non-text content. They're essentially collaborative versions of `Blob`s that sync automatically across devices.

Use FileStreams when you need to:

* Distribute documents across devices
* Store audio or video files
* Sync any binary data between users

**Note:** For images specifically, Jazz provides the higher-level `ImageDefinition` abstraction which manages multiple image resolutions - see the [ImageDefinition documentation](/docs/core-concepts/covalues/imagedef) for details.

FileStreams provide automatic chunking when using the `createFromBlob` method, track upload progress, and handle MIME types and metadata.

In your schema, reference FileStreams like any other CoValue:

**File name: schema.ts**

```ts
import { co, z } from "jazz-tools";

const Document = co.map({
  title: z.string(),
  file: co.fileStream(), // Store a document file
});

```

## Creating FileStreams

There are two main ways to create FileStreams: creating empty ones for manual data population or creating directly from existing files or blobs.

### Creating from Blobs and Files

For files from input elements or drag-and-drop interfaces, use `createFromBlob`:

```ts
// From a file input
const fileInput = document.querySelector(
  'input[type="file"]',
) as HTMLInputElement;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  // Create FileStream from user-selected file
  const fileStream = await co
    .fileStream()
    .createFromBlob(file, { owner: myGroup });

  // Or with progress tracking for better UX
  const fileWithProgress = await co.fileStream().createFromBlob(file, {
    onProgress: (progress) => {
      // progress is a value between 0 and 1
      const percent = Math.round(progress * 100);
      console.log(`Upload progress: ${percent}%`);
      progressBar.style.width = `${percent}%`;
    },
    owner: myGroup,
  });
});

```

### Creating Empty FileStreams

Create an empty FileStream when you want to manually [add binary data in chunks](#writing-to-filestreams):

```ts
const fileStream = co.fileStream().create({ owner: myGroup });

```

### Ownership

Like other CoValues, you can specify ownership when creating FileStreams.

```ts
// Create a team group
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

// Create a FileStream with shared ownership
const teamFileStream = co.fileStream().create({ owner: teamGroup });

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to FileStreams.

## Reading from FileStreams

`FileStream`s provide several ways to access their binary content, from raw chunks to convenient Blob objects.

### Getting Raw Data Chunks

To access the raw binary data and metadata:

```ts
// Get all chunks and metadata
const fileData = fileStream.getChunks();

if (fileData) {
  console.log(`MIME type: ${fileData.mimeType}`);
  console.log(`Total size: ${fileData.totalSizeBytes} bytes`);
  console.log(`File name: ${fileData.fileName}`);
  console.log(`Is complete: ${fileData.finished}`);

  // Access raw binary chunks
  for (const chunk of fileData.chunks) {
    // Each chunk is a Uint8Array
    console.log(`Chunk size: ${chunk.length} bytes`);
  }
}

```

By default, `getChunks()` only returns data for completely synced `FileStream`s. To start using chunks from a `FileStream` that's currently still being synced use the `allowUnfinished` option:

```ts
// Get data even if the stream isn't complete
const partialData = fileStream.getChunks({ allowUnfinished: true });

```

### Converting to Blobs

For easier integration with web APIs, convert to a `Blob`:

```ts
// Convert to a Blob
const blob = fileStream.toBlob();

// Get the filename from the metadata
const filename = fileStream.getChunks()?.fileName;

if (blob) {
  // Use with URL.createObjectURL
  const url = URL.createObjectURL(blob);

  // Create a download link
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "document.pdf";
  link.click();

  // Clean up when done
  URL.revokeObjectURL(url);
}

```

### Loading FileStreams as Blobs

You can directly load a `FileStream` as a `Blob` when you only have its ID:

```ts
// Load directly as a Blob when you have an ID
const blobFromID = await co.fileStream().loadAsBlob(fileStreamId);

// By default, waits for complete uploads
// For in-progress uploads:
const partialBlob = await co.fileStream().loadAsBlob(fileStreamId, {
  allowUnfinished: true,
});

```

### Checking Completion Status

Check if a `FileStream` is fully synced:

```ts
if (fileStream.isBinaryStreamEnded()) {
  console.log("File is completely synced");
} else {
  console.log("File upload is still in progress");
}

```

## Writing to FileStreams

When creating a `FileStream` manually (not using `createFromBlob`), you need to manage the upload process yourself. This gives you more control over chunking and progress tracking.

### The Upload Lifecycle

`FileStream` uploads follow a three-stage process:

1. **Start** \- Initialize with metadata
2. **Push** \- Send one or more chunks of data
3. **End** \- Mark the stream as complete

### Starting a `FileStream`

Begin by providing metadata about the file:

```ts
// Create an empty FileStream
const manualFileStream = co.fileStream().create({ owner: myGroup });

// Initialize with metadata
manualFileStream.start({
  mimeType: "application/pdf", // MIME type (required)
  totalSizeBytes: 1024 * 1024 * 2, // Size in bytes (if known)
  fileName: "document.pdf", // Original filename (optional)
});

```

### Pushing Data

Add binary data in chunks - this helps with large files and progress tracking:

```ts
const data = new Uint8Array(arrayBuffer);

// For large files, break into chunks (e.g., 100KB each)
const chunkSize = 1024 * 100;
for (let i = 0; i < data.length; i += chunkSize) {
  // Create a slice of the data
  const chunk = data.slice(i, i + chunkSize);

  // Push chunk to the FileStream
  fileStream.push(chunk);

  // Track progress
  const progress = Math.min(
    100,
    Math.round(((i + chunk.length) * 100) / data.length),
  );
  console.log(`Upload progress: ${progress}%`);
}

// Finalise the upload
fileStream.end();

console.log("Upload complete!");

```

### Completing the Upload

Once all chunks are pushed, mark the `FileStream` as complete:

```ts
// Finalise the upload
fileStream.end();

console.log("Upload complete!");

```

## Subscribing to `FileStream`s

Like other CoValues, you can subscribe to `FileStream`s to get notified of changes as they happen. This is especially useful for tracking upload progress when someone else is uploading a file.

### Loading by ID

Load a `FileStream` when you have its ID:

```ts
const fileStreamFromId = await co.fileStream().load(fileStreamId);

if (fileStream.$isLoaded) {
  console.log("FileStream loaded successfully");

  // Check if it's complete
  if (fileStream.isBinaryStreamEnded()) {
    // Process the completed file
    const blob = fileStream.toBlob();
  }
}

```

### Subscribing to Changes

Subscribe to a `FileStream` to be notified when chunks are added or when the upload is complete:

```ts
const unsubscribe = co
  .fileStream()
  .subscribe(fileStreamId, (fileStream: FileStream) => {
    // Called whenever the FileStream changes
    console.log("FileStream updated");

    // Get current status
    const chunks = fileStream.getChunks({ allowUnfinished: true });
    if (chunks) {
      const uploadedBytes = chunks.chunks.reduce(
        (sum: number, chunk: Uint8Array) => sum + chunk.length,
        0,
      );
      const totalBytes = chunks.totalSizeBytes || 1;
      const progress = Math.min(
        100,
        Math.round((uploadedBytes * 100) / totalBytes),
      );

      console.log(`Upload progress: ${progress}%`);

      if (fileStream.isBinaryStreamEnded()) {
        console.log("Upload complete!");
        // Now safe to use the file
        const blob = fileStream.toBlob();

        // Clean up the subscription if we're done
        unsubscribe();
      }
    }
  });

```

### Waiting for Upload Completion

If you need to wait for a `FileStream` to be fully synchronized across devices:

```ts
// Wait for the FileStream to be fully synced
await fileStream.$jazz.waitForSync({
  timeout: 5000, // Optional timeout in ms
});

console.log("FileStream is now synced to all connected devices");

```

This is useful when you need to ensure that a file is available to other users before proceeding with an operation.


### CoVectors
# CoVectors

CoVectors let you store and query high‑dimensional vectors directly in Jazz apps. They are ideal for semantic search, or personalization features that work offline, sync across devices, and remain end‑to‑end encrypted.

The [Journal example](https://github.com/garden-co/jazz/tree/main/examples/vector-search) demonstrates semantic search using of CoVector.

CoVectors are defined using `co.vector()`, and are often used as fields in a CoMap within a CoList (making it easy to perform vector search across list items).

```ts
import { co, z } from "jazz-tools";

const Embedding = co.vector(384); // Define 384-dimensional embedding

const Document = co.map({
  content: z.string(),
  embedding: Embedding,
});

export const DocumentsList = co.list(Document);

```

The number of dimensions matches the embedding model used in your app. Many small sentence transformers produce 384‑dim vectors; others use 512, 768, 1024 or more.

## Creating CoVectors

You can create vectors in your Jazz application from an array of numbers, or Float32Array instance.

```ts
// Generate embeddings (bring your own embeddings model)
const vectorData = await createEmbedding("Text");

const newDocument = Document.create({
content: "Text",
embedding: Embedding.create(vectorData),
});

documents.$jazz.push(newDocument);

```

### Ownership

Like other CoValues, you can specify ownership when creating CoVectors.

```ts
// Create with shared ownership
const teamGroup = Group.create();
teamGroup.addMember(colleagueAccount, "writer");

const teamList = co.vector(384).create(vector, { owner: teamGroup });

```

See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to CoVectors.

### Immutability

CoVectors cannot be changed after creation. Instead, create a new CoVector with the updated values and replace the previous one.

## Semantic Search

Semantic search lets you find data based on meaning, not just keywords. In Jazz, you can easily sort results by how similar they are to your search query.

Use the `useCoState` hook to load your data and sort it by similarity to your query embedding:

```tsx
import { useCoState } from "jazz-tools/react";

const { queryEmbedding } = useCreateEmbedding();

const foundDocuments = useCoState(DocumentsList, documentsListId, {
  resolve: {
    $each: { embedding: true },
  },
  select(documents) {
    if (!documents.$isLoaded) return;

    // If no query embedding, return all entries
    if (!queryEmbedding) return documents.map((value) => ({ value }));

    return documents
      .map((value) => ({
        value,
        similarity: value.embedding.$jazz.cosineSimilarity(queryEmbedding), // [!code ++]
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .filter((result) => result.similarity > 0.5);
  },
});

```

Wrapping each item with its similarity score makes it easy to sort, filter, and display the most relevant results. This approach is widely used in vector search and recommendation systems, since it keeps both the data and its relevance together for further processing or display.

### Cosine Similarity

To compare how similar two vectors are, we use their [cosine similarity](https://en.wikipedia.org/wiki/Cosine%5Fsimilarity). This returns a value between `-1` and `1`, describing how similar the vectors are:

* `1` means the vectors are identical
* `0` means the vectors are orthogonal (i.e. no similarity)
* `-1` means the vectors are opposite direction (perfectly dissimilar).

If you sort items by their cosine similarity, the ones which are most similar will appear at the top of the list.

Jazz provides a built-in `$jazz.cosineSimilarity` method to calculate this for you.

## Embedding Models

CoVectors handles storage and search, you provide the vectors. Generate embeddings with any model you prefer (Hugging Face, OpenAI, custom, etc).

**Recommended:** Run models locally for privacy and offline support using [Transformers.js](https://huggingface.co/docs/transformers.js). Check our [Journal app example](https://github.com/garden-co/jazz/tree/main/examples/vector-search) to see how to do this.

The following models offer a good balance between accuracy and performance:

* [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) — 384 dimensions, \~23 MB
* [Xenova/paraphrase-multilingual-mpnet-base-v2](https://huggingface.co/Xenova/paraphrase-multilingual-mpnet-base-v2) — 768 dimensions, \~279 MB
* [mixedbread-ai/mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) — 1024 dimensions, \~337 MB
* [Browse more models →](https://huggingface.co/models?pipeline%5Ftag=feature-extraction&library=transformers.js)

Alternatively, you can generate embeddings using server-side or commercial APIs (such as OpenAI or Anthropic).

## Best Practices

### Changing embedding models

**Always use the same embedding model for all vectors you intend to compare.**Mixing vectors from different models (or even different versions of the same model) will result in meaningless similarity scores, as the vector spaces are not compatible.

If you need to switch models, consider storing the model identifier alongside each vector, and re-embedding your data as needed.


### ImageDefinitions
# ImageDefinition

`ImageDefinition` is a specialized CoValue designed specifically for managing images in Jazz applications. It extends beyond basic file storage by supporting a blurry placeholder, built-in resizing, and progressive loading patterns.

Beyond `ImageDefinition`, Jazz offers higher-level functions and components that make it easier to use images:

* [createImage()](#creating-images) \- function to create an `ImageDefinition` from a file
* [loadImage, loadImageBySize, highestResAvailable](#displaying-images) \- functions to load and display images
* [Image](#displaying-images) \- Component to display an image

The [Image Upload example](https://github.com/gardencmp/jazz/tree/main/examples/image-upload) demonstrates use of images in Jazz.

## Creating Images

The easiest way to create and use images in your Jazz application is with the `createImage()` function:

```ts
import { createImage } from "jazz-tools/media";

// Create an image from a file input
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (file && me.profile.$isLoaded) {
    // Creates ImageDefinition with a blurry placeholder, limited to 1024px on the longest side, and multiple resolutions automatically
    const image = await createImage(file, {
      owner: me.$jazz.owner,
      maxSize: 1024,
      placeholder: "blur",
      progressive: true,
    });

    // Store the image in your application data
    me.profile.$jazz.set("image", image);
  }
}

```

The `createImage()` function:

* Creates an `ImageDefinition` with the right properties
* Optionally generates a small placeholder for immediate display
* Creates multiple resolution variants of your image
* Returns the created `ImageDefinition`

### Configuration Options

```ts
declare function createImage(
  image: Blob | File | string,
  options?: {
    owner?: Group | Account;
    placeholder?: false | "blur";
    maxSize?: number;
    progressive?: boolean;
  },
): Promise<Loaded<typeof ImageDefinition, { original: true }>>;

```

#### `image`

The image to create an `ImageDefinition` from.

This can be a `Blob` or a `File`.

#### `owner`

The owner of the `ImageDefinition`. This is used to control access to the image. See [Groups as permission scopes](/docs/permissions-and-sharing/overview) for more information on how to use groups to control access to images.

#### `placeholder`

Disabled by default. This option allows you to automatically generate a low resolution preview for use while the image is loading. Currently, only `"blur"` is a supported.

#### `maxSize`

The image generation process includes a maximum size setting that controls the longest side of the image. A built-in resizing feature is applied based on this setting.

#### `progressive`

The progressive loading pattern is a technique that allows images to load incrementally, starting with a small version and gradually replacing it with a larger version as it becomes available. This is useful for improving the user experience by showing a placeholder while the image is loading.

Passing `progressive: true` to `createImage()` will create internal smaller versions of the image for future uses.

### Create multiple resized copies

To create multiple resized copies of an original image for better layout control, you can use the `createImage` function multiple times with different parameters for each desired size. Here’s an example of how you might implement this:

```ts
import { co } from "jazz-tools";
import { createImage } from "jazz-tools/media";

// Jazz Schema
const ProductImage = co.map({
  image: co.image(),
  thumbnail: co.image(),
});

const mainImage = await createImage(myBlob);
const thumbnail = await createImage(myBlob, {
  maxSize: 100,
});

// or, in case of migration, you can use the original stored image.
const newThumb = await createImage(mainImage!.original!.toBlob()!, {
  maxSize: 100,
});

const imageSet = ProductImage.create({
  image: mainImage,
  thumbnail,
});

```

### Creating images on the server

We provide a `createImage` function to create images from server side using the same options as the browser version, using the package `jazz-tools/media/server`. Check the [server worker](/docs/server-side/setup) documentation to learn more.

The resize features are based on the `sharp` library, then it is requested as peer dependency in order to use it.

```sh
npm install sharp

```

```ts
import fs from "node:fs";
import { createImage } from "jazz-tools/media/server";

const image = fs.readFileSync(new URL("./image.jpg", import.meta.url));

await createImage(image, {
  // options
});

```

## Displaying Images

To use the stored ImageDefinition, there are two ways: declaratively, using the `Image` component, and imperatively, using the static methods.

The Image component is the best way to let Jazz handle the image loading.

### `<Image>` component \[!framework=react,svelte,react-native,react-native-expo\]

```tsx
import { co, ImageDefinition } from "jazz-tools";
import { Image } from "jazz-tools/react";

function GalleryView({ image }: { image: co.loaded<typeof ImageDefinition> }) {
  return (
    <div className="image-container">
      <Image imageId={image.$jazz.id} alt="Profile" width={600} />
    </div>
  );
}

```

The `Image` component handles:

* Showing a placeholder while loading, if generated or specified
* Automatically selecting the appropriate resolution, if generated with progressive loading
* Progressive enhancement as higher resolutions become available, if generated with progressive loading
* Determining the correct width/height attributes to avoid layout shifting
* Cleaning up resources when unmounted

The component's props are:

```ts
export type ImageProps = Omit<
  HTMLImgAttributes,
  "src" | "srcset" | "width" | "height"
> & {
  imageId: string;
  width?: number | "original";
  height?: number | "original";
  placeholder?: string;
};

```

#### Width and Height props \[!framework=react,svelte,react-native,react-native-expo\]

The `width` and `height` props are used to control the best resolution to use but also the width and height attributes of the image tag.

Let's say we have an image with a width of 1920px and a height of 1080px.

```tsx
<Image imageId="123" />
      // Image with the highest resolution available
      <Image imageId="123" width="original" height="original" />
      // Image with width 1920 and height 1080
      <Image imageId="123" width={600} />
      // Better to avoid, as may be rendered with 0 height
      <Image imageId="123" width={600} height="original" />
      // Keeps the aspect ratio (height: 338)
      <Image imageId="123" width="original" height={600} />
      // As above, aspect ratio is maintained, width is 1067
      <Image imageId="123" width={600} height={600} />
      // Renders as a 600x600 square

```

If the image was generated with progressive loading, the `width` and `height` props will determine the best resolution to use.

#### Lazy loading \[!framework=react,svelte\]

The `Image` component supports lazy loading with the \[same options as the native browser `loading` attribute\].(https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#loading). It will generate the blob url for the image when the browser's viewport reaches the image.

```tsx
<Image imageId="123" width="original" height="original" loading="lazy" />

```

#### Placeholder

You can choose to specify a custom placeholder to display as a fallback while an image is loading in case your image does not have a placeholder generated. A data URL or a URL for a static asset works well here.

### Imperative Usage \[!framework=react,svelte,react-native,react-native-expo\]

Like other CoValues, `ImageDefinition` can be used to load the object.

```tsx
const image = await ImageDefinition.load("123", {
  resolve: {
    original: true,
  },
});

if (image.$isLoaded) {
  console.log({
    originalSize: image.originalSize,
    placeholderDataUrl: image.placeholderDataURL,
    original: image.original, // this FileStream may be not loaded yet
  });
}

```

`image.original` is a `FileStream` and its content can be read as described in the [FileStream](/docs/core-concepts/covalues/filestreams#reading-from-filestreams) documentation.

Since FileStream objects are also CoValues, they must be loaded before use. To simplify loading, if you want to load the binary data saved as Original, you can use the `loadImage` function.

```tsx
import { loadImage } from "jazz-tools/media";

const loadedImage = await loadImage(imageDefinitionOrId);
if (loadedImage === null) {
  throw new Error("Image not found");
}

const img = document.createElement("img");
img.width = loadedImage.width;
img.height = loadedImage.height;
img.src = URL.createObjectURL(loadedImage.image.toBlob()!);
img.onload = () => URL.revokeObjectURL(img.src);

```

If the image was generated with progressive loading, and you want to access the best-fit resolution, use `loadImageBySize`. It will load the image of the best resolution that fits the wanted width and height.

```tsx
import { loadImageBySize } from "jazz-tools/media";

const imageLoadedBySize = await loadImageBySize(imageDefinitionOrId, 600, 600); // 600x600

if (imageLoadedBySize) {
  console.log({
    width: imageLoadedBySize.width,
    height: imageLoadedBySize.height,
    image: imageLoadedBySize.image,
  });
}

```

If want to dynamically listen to the _loaded_ resolution that best fits the wanted width and height, you can use the `subscribe` and the `highestResAvailable` function.

```tsx
import { highestResAvailable } from "jazz-tools/media";

const progressiveImage = await ImageDefinition.load(imageId);

if (!progressiveImage.$isLoaded) {
  throw new Error("Image not loaded");
}

const img = document.createElement("img");
img.width = 600;
img.height = 600;

// start with the placeholder
if (progressiveImage.placeholderDataURL) {
  img.src = progressiveImage.placeholderDataURL;
}

// then listen to the image changes
progressiveImage.$jazz.subscribe({}, (image) => {
  const bestImage = highestResAvailable(image, 600, 600);

  if (bestImage) {
    // bestImage is again a FileStream
    const blob = bestImage.image.toBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
    }
  }
});

```

## Custom image manipulation implementations

To manipulate images (like placeholders, resizing, etc.), `createImage()` uses different implementations depending on the environment.

On the browser, image manipulation is done using the `canvas` API.

If you want to use a custom implementation, you can use the `createImageFactory` function in order create your own `createImage` function and use your preferred image manipulation library.

```tsx
import { createImageFactory } from "jazz-tools/media";

const customCreateImage = createImageFactory({
  createFileStreamFromSource: async (source, owner) => {
    // ...
  },
  getImageSize: async (image) => {
    // ...
  },
  getPlaceholderBase64: async (image) => {
    // ...
  },
  resize: async (image, width, height) => {
    // ...
  },
});

```

## Best Practices

* **Set image sizes** when possible to avoid layout shifts
* **Use placeholders** (like LQIP - Low Quality Image Placeholders) for instant rendering
* **Prioritize loading** the resolution appropriate for the current viewport
* **Consider device pixel ratio** (window.devicePixelRatio) for high-DPI displays
* **Always call URL.revokeObjectURL** after the image loads to prevent memory leaks


### Connecting CoValues
# Connecting CoValues with direct linking

CoValues can form relationships with each other by **linking directly to other CoValues**. This creates a powerful connection where one CoValue can point to the unique identity of another. Instead of embedding all the details of one CoValue directly within another, you use its Jazz-Tools schema as the field type. This allows multiple CoValues to point to the same piece of data effortlessly.

```ts
import { co, z, Loaded, Group, Account } from "jazz-tools";

export const Location = co.map({
  city: z.string(),
  country: z.string(),
});
export type Location = co.loaded<typeof Location>;

// co.ref can be used within CoMap fields to point to other CoValues
const Actor = co.map({
  name: z.string,
  imageURL: z.string,
  birthplace: Location, // Links directly to the Location CoMap above.
});
export type Actor = co.loaded<typeof Actor>;

//  actual actor data is stored in the separate Actor CoValue
const Movie = co.map({
  title: z.string,
  director: z.string,
  cast: co.list(Actor), // ordered, mutable
});
export type Movie = co.loaded<typeof Movie>;

// A User CoMap can maintain a CoFeed of co.ref(Movie) to track their favorite movies
const User = co.map({
  username: z.string,
  favoriteMovies: co.feed(Movie), // append-only
});
export type User = co.loaded<typeof User>;

```

### Understanding CoList and CoFeed

* CoList is a collaborative list where each item is a reference to a CoValue
* CoFeed contains an append-only list of references to CoValues.

This direct linking approach offers a single source of truth. When you update a referenced CoValue, all other CoValues that point to it are automatically updated, ensuring data consistency across your application.

By connecting CoValues through these direct references, you can build robust and collaborative applications where data is consistent, efficient to manage, and relationships are clearly defined. The ability to link different CoValue types to the same underlying data is fundamental to building complex applications with Jazz.


### Accounts & migrations
# Accounts & Migrations

## CoValues as a graph of data rooted in accounts

Compared to traditional relational databases with tables and foreign keys, Jazz is more like a graph database, or GraphQL APIs — where CoValues can arbitrarily refer to each other and you can resolve references without having to do a join. (See [Subscribing & deep loading](/docs/core-concepts/subscription-and-loading)).

To find all data related to a user, the account acts as a root node from where you can resolve all the data they have access to. These root references are modeled explicitly in your schema, distinguishing between data that is typically public (like a user's profile) and data that is private (like their messages).

### `Account.root` \- private data a user cares about

Every Jazz app that wants to refer to per-user data needs to define a custom root `CoMap` schema and declare it in a custom `Account` schema as the `root` field:

```ts
import { co, z } from "jazz-tools";

const MyAppRoot = co.map({
  myChats: co.list(Chat),
});

export const MyAppAccount = co.account({
  root: MyAppRoot,
  profile: co.profile(),
});

```

### `Account.profile` \- public data associated with a user

The built-in `Account` schema class comes with a default `profile` field, which is a CoMap (in a Group with `"everyone": "reader"` \- so publicly readable permissions) that is set up for you based on the username the `AuthMethod` provides on account creation.

Their pre-defined schemas roughly look like this:

```ts
// ...somewhere in jazz-tools itself...
const Account = co.account({
  root: co.map({}),
  profile: co.profile(),
});

```

If you want to keep the default `co.profile()` schema, but customise your account's private `root`, you can use `co.profile()` without options.

If you want to extend the `profile` to contain additional fields (such as an avatar `co.image()`), you can declare your own profile schema class using `co.profile({...})`. A `co.profile({...})` is a [type of CoMap](/docs/core-concepts/covalues/comaps), so you can add fields in the same way:

```ts
export const MyAppProfile = co.profile({
  name: z.string(), // compatible with default Profile schema
  avatar: co.optional(co.image()),
});

export const MyAppAccountWithProfile = co.account({
  root: MyAppRoot,
  profile: MyAppProfile,
});

```

**Info:** 

When using custom profile schemas, you need to take care of initializing the `profile` field in a migration, and set up the correct permissions for it. See [Adding/changing fields to root and profile](#addingchanging-fields-to-root-and-profile).

## Resolving CoValues starting at `profile` or `root`

To use per-user data in your app, you typically use `useAccount` with your custom Account schema and specify which references to resolve using a resolve query (see [Subscribing & deep loading](/docs/core-concepts/subscription-and-loading)).

Jazz will deduplicate loads, so you can safely use `useAccount` multiple times throughout your app without any performance overhead to ensure each component has exactly the data it needs.

```tsx
import { useAccount } from "jazz-tools/react";

function DashboardPageComponent() {
  const me = useAccount(MyAppAccount, {
    resolve: {
      profile: true,
      root: {
        myChats: { $each: true },
      },
    },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      {me.$isLoaded ? (
        <div>
          <p>Logged in as {me.profile.name}</p>
          <h2>My chats</h2>
          {me.root.myChats.map((chat) => (
            <ChatPreview key={chat.$jazz.id} chat={chat} />
          ))}
        </div>
      ) : (
        "Loading..."
      )}
    </div>
  );
}

```

## Populating and evolving `root` and `profile` schemas with migrations

As you develop your app, you'll likely want to

* initialise data in a user's `root` and `profile`
* add more data to your `root` and `profile` schemas

You can achieve both by overriding the `migrate()` method on your `Account` schema class.

### When migrations run

Migrations are run after account creation and every time a user logs in. Jazz waits for the migration to finish before passing the account to your app's context.

### Initialising user data after account creation

```ts
export const MyAppAccountWithMigration = co
  .account({
    root: MyAppRoot,
    profile: MyAppProfile,
  })
  .withMigration((account, creationProps?: { name: string }) => {
    // we use has to check if the root has ever been set
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        myChats: [],
      });
    }

    if (!account.$jazz.has("profile")) {
      const profileGroup = Group.create();
      // Unlike the root, we want the profile to be publicly readable.
      profileGroup.makePublic();

      account.$jazz.set(
        "profile",
        MyAppProfile.create(
          {
            name: creationProps?.name ?? "New user",
          },
          profileGroup,
        ),
      );
    }
  });

```

### Adding/changing fields to `root` and `profile`

To add new fields to your `root` or `profile` schemas, amend their corresponding schema classes with new fields, and then implement a migration that will populate the new fields for existing users (by using initial data, or by using existing data from old fields).

To do deeply nested migrations, you might need to use the asynchronous `$jazz.ensureLoaded()` method before determining whether the field already exists, or is simply not loaded yet.

Now let's say we want to add a `myBookmarks` field to the `root` schema:

```ts
const MyAppRoot = co.map({
  myChats: co.list(Chat),
  myBookmarks: co.optional(co.list(Bookmark)), // [!code ++:1]
});

export const MyAppAccount = co
  .account({
    root: MyAppRoot,
    profile: MyAppProfile,
  })
  .withMigration(async (account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        myChats: [],
      });
    }

    // We need to load the root field to check for the myBookmarks field
    const { root } = await account.$jazz.ensureLoaded({
      resolve: { root: true },
    });

    if (!root.$jazz.has("myBookmarks")) {
      // [!code ++:3]
      root.$jazz.set(
        "myBookmarks",
        co.list(Bookmark).create([], Group.create()),
      );
    }
  });

```

### Guidance on building robust schemas

Once you've published a schema, you should only ever add fields to it. This is because you have no way of ensuring that a new schema is distributed to all clients, especially if you're building a local-first app.

You should plan to be able to handle data from users using any former schema version that you have published for your app.


### Schema Unions
# Schema Unions

Schema unions allow you to create types that can be one of several different schemas, similar to TypeScript union types. They use a discriminator field to determine which specific schema an instance represents at runtime, enabling type-safe polymorphism in your Jazz applications.

The following operations are not available in schema unions:

* `$jazz.ensureLoaded` — use the union schema's `load` method, or narrow the type first
* `$jazz.subscribe` — use the union schema's `subscribe` method
* `$jazz.set` — use `$jazz.applyDiff`

## Creating schema unions

Schema unions are defined with `co.discriminatedUnion()` by providing an array of schemas and a discriminator field. The discriminator field must be a `z.literal()`.

```ts
export const ButtonWidget = co.map({
  type: z.literal("button"),
  label: z.string(),
});

export const SliderWidget = co.map({
  type: z.literal("slider"),
  min: z.number(),
  max: z.number(),
});

export const WidgetUnion = co.discriminatedUnion("type", [
  ButtonWidget,
  SliderWidget,
]);

```

To instantiate a schema union, just use the `create` method of one of the member schemas:

```ts
const dashboard = Dashboard.create({
  widgets: [
    ButtonWidget.create({ type: "button", label: "Click me" }),
    SliderWidget.create({ type: "slider", min: 0, max: 100 }),
  ],
});

```

You can also use plain JSON objects, and let Jazz infer the concrete type from the discriminator field:

```ts
const dashboardFromJSON = Dashboard.create({
  widgets: [
    { type: "button", label: "Click me" },
    { type: "slider", min: 0, max: 100 },
  ],
});

```

## Narrowing unions

When working with schema unions, you can access any property that is common to all members of the union. To access properties specific to a particular union member, you need to narrow the type. You can do this using a [TypeScript type guard](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) on the discriminator field:

```ts
dashboard.widgets.forEach((widget) => {
  if (widget.type === "button") {
    console.log(`Button: ${widget.label}`);
  } else if (widget.type === "slider") {
    console.log(`Slider: ${widget.min} to ${widget.max}`);
  }
});

```

## Loading schema unions

You can load an instance of a schema union using its ID, without having to know its concrete type:

```ts
const widget = await WidgetUnion.load(widgetId);

// Subscribe to updates
const unsubscribe = WidgetUnion.subscribe(widgetId, {}, (widget) => {
  console.log("Widget updated:", widget);
});

```

## Nested schema unions

You can create complex hierarchies by nesting discriminated unions within other unions:

```ts
// Define error types
const BadRequestError = co.map({
  status: z.literal("failed"),
  code: z.literal(400),
  message: z.string(),
});

const UnauthorizedError = co.map({
  status: z.literal("failed"),
  code: z.literal(401),
  message: z.string(),
});

const InternalServerError = co.map({
  status: z.literal("failed"),
  code: z.literal(500),
  message: z.string(),
});

// Create a union of error types
const ErrorResponse = co.discriminatedUnion("code", [
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
]);

// Define success type
const SuccessResponse = co.map({
  status: z.literal("success"),
  data: z.string(),
});

// Create a top-level union that includes the error union
const ApiResponse = co.discriminatedUnion("status", [
  SuccessResponse,
  ErrorResponse,
]);

function handleResponse(response: co.loaded<typeof ApiResponse>) {
  if (response.status === "success") {
    console.log("Success:", response.data);
  } else {
    // This is an error - narrow further by error code
    if (response.code === 400) {
      console.log("Bad request:", response.message);
    } else if (response.code === 401) {
      console.log("Unauthorized:", response.message);
    } else if (response.code === 500) {
      console.log("Server error:", response.message);
    }
  }
}

```

## Limitations with schema unions

Schema unions have some limitations that you should be aware of. They are due to TypeScript behaviour with type unions: when the type members of the union have methods with generic parameters, TypeScript will not allow calling those methods on the union type. This affects some of the methods on the `$jazz` namespace.

Note that these methods may still work at runtime, but their use is not recommended as you will lose type safety.

### `$jazz.ensureLoaded` and `$jazz.subscribe` require type narrowing

The `$jazz.ensureLoaded` and `$jazz.subscribe` methods are not supported directly on a schema union unless you first narrow the type using the discriminator.

### Updating union fields

You can't use `$jazz.set` to modify a schema union's fields (even if the field is present in all the union members). Use `$jazz.applyDiff` instead.


### Codecs
# Codecs

You can use Zod `z.codec()` schemas to store arbitrary data types such as class instances within CoValues by defining custom encoders. This allows you to directly use these data types within CoValues without having to do an extra manual conversion step.

## Using Zod codecs

To use a Zod `z.codec()` with Jazz, your encoder must encode the data into a JSON-compatible format. This is means that the `Input` type shall map to the JSON-compatible type, and `Output` will map to your custom type.

```ts
class Greeter {
  constructor(public name: string) {}

  greet() {
    console.log(`Hello, ${this.name}!`);
  }
}

const schema = co.map({
  greeter: z.codec(z.string(), z.z.instanceof(Greeter), {
    encode: (value) => value.name,
    decode: (value) => new Greeter(value),
  }),
});

const porter = schema.create({
  greeter: new Greeter("Alice"),
});

porter.greeter.greet();

```

**Info:** 

Schemas that are not directly supported by Jazz such as `z.instanceof` are not re-exported by Jazz under the `z` object. The full Zod API is exported under `z.z` if you need to use any of these schemas as part of a codec.


### Subscriptions & Deep Loading
# Subscriptions & Deep Loading

Jazz's Collaborative Values (such as [CoMaps](/docs/core-concepts/covalues/comaps) or [CoLists](/docs/core-concepts/covalues/colists)) are reactive. You can subscribe to them to automatically receive updates whenever they change, either locally or remotely.

You can also use subscriptions to load CoValues _deeply_ by resolving nested values. You can specify exactly how much data you want to resolve and handle loading states and errors.

You can load and subscribe to CoValues in one of two ways:

* **shallowly** — all of the primitive fields are available (such as strings, numbers, dates), but the references to other CoValues are not loaded
* **deeply** — some or all of the referenced CoValues have been loaded

**Info: Tip** 

Jazz automatically deduplicates loading. If you subscribe to the same CoValue multiple times in your app, Jazz will only fetch it once. That means you don’t need to deeply load a CoValue _just in case_ a child component might need its data, and you don’t have to worry about tracking every possible field your app needs in a top-level query. Instead, pass the CoValue ID to the child component and subscribe there — Jazz will only load what that component actually needs.

## Subscription Hooks

On your front-end, using a subscription hook is the easiest way to manage your subscriptions. The subscription and related clean-up is handled automatically, and you can use your data like any other piece of state in your app.

### Subscribe to CoValues

The `useCoState` hook allows you to reactively subscribe to CoValues in your React components. It will subscribe to updates when the component mounts and unsubscribe when it unmounts, ensuring your UI stays in sync and avoiding memory leaks.

```tsx
import { useCoState } from "jazz-tools/react";

function ProjectView({ projectId }: { projectId: string }) {
  // Subscribe to a project and resolve its tasks
  const project = useCoState(Project, projectId, {
    resolve: { tasks: { $each: true } }, // Tell Jazz to load each task in the list
  });

  if (!project.$isLoaded) {
    switch (project.$jazz.loadingState) {
      case "unauthorized":
        return "Project not accessible";
      case "unavailable":
        return "Project not found";
      case "loading":
        return "Loading project...";
    }
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <ul>
        {project.tasks.map((task) => (
          <li key={task.$jazz.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}

```

**Note:** If you don't need to load a CoValue's references, you can choose to load it _shallowly_ by omitting the resolve query.

### Subscribe to the current user's account

`useAccount` is similar to `useCoState`, but it returns the current user's account. You can use this at the top level of your app to subscribe to the current user's [account profile and root](/docs/core-concepts/schemas/accounts-and-migrations#covalues-as-a-graph-of-data-rooted-in-accounts).

```tsx
import { useAccount } from "jazz-tools/react";
import { MyAppAccount } from "./schema";

function ProjectList() {
  const me = useAccount(MyAppAccount, {
    resolve: { profile: true },
  });

  if (!me.$isLoaded) {
    return "Loading...";
  }

  return (
    <div>
      <h1>{me.profile.name}'s projects</h1>
    </div>
  );
}

```

### Loading States

When you load or subscribe to a CoValue through a hook (or directly), it can be either:

* **Loaded** → The CoValue has been successfully loaded and all its data is available
* **Not Loaded** → The CoValue is not yet available

You can use the `$isLoaded` field to check whether a CoValue is loaded. For more detailed information about why a CoValue is not loaded, you can check `$jazz.loadingState`:

* `"loading"` → The CoValue is still being fetched
* `"unauthorized"` → The current user doesn't have permission to access this CoValue
* `"unavailable"` → The CoValue couldn't be found or an error (e.g. a network timeout) occurred while loading

See the examples above for practical demonstrations of how to handle these three states in your application.

## Deep Loading

When you're working with related CoValues (like tasks in a project), you often need to load nested references as well as the top-level CoValue.

This is particularly the case when working with [CoMaps](/docs/core-concepts/covalues/comaps) that refer to other CoValues or [CoLists](/docs/core-concepts/covalues/colists) of CoValues. You can use `resolve` queries to tell Jazz what data you need to use.

### Using Resolve Queries

A `resolve` query tells Jazz how deeply to load data for your app to use. We can use `true` to tell Jazz to shallowly load the tasks list here. Note that this does _not_ cause the tasks themselves to load, just the CoList that holds the tasks.

```ts
const Task = co.map({
  title: z.string(),
  description: co.plainText(),
  get subtasks() {
    return co.list(Task);
  },
});

const Project = co.map({
  name: z.string(),
  tasks: co.list(Task),
});

const project = await Project.load(projectId);
if (!project.$isLoaded) throw new Error("Project not found or not accessible");

// This will be loaded
project.name; // string

// This *may not be loaded*, and *may not be accessible*
project.tasks; // MaybeLoaded<ListOfTasks>

const projectWithTasksShallow = await Project.load(projectId, {
  resolve: {
    tasks: true,
  },
});
if (!projectWithTasksShallow.$isLoaded)
  throw new Error("Project not found or not accessible");

// This list of tasks will be shallowly loaded
projectWithTasksShallow.tasks; // ListOfTasks
// We can access the properties of the shallowly loaded list
projectWithTasksShallow.tasks.length; // number
// This *may not be loaded*, and *may not be accessible*
projectWithTasksShallow.tasks[0]; // MaybeLoaded<Task>

```

We can use an `$each` expression to tell Jazz to load the items in a list.

```ts
const projectWithTasks = await Project.load(projectId, {
  resolve: {
    tasks: {
      $each: true,
    },
  },
});
if (!projectWithTasks.$isLoaded)
  throw new Error("Project not found or not accessible");

// The task will be loaded
projectWithTasks.tasks[0]; // Task
// Primitive fields are always loaded
projectWithTasks.tasks[0].title; // string
// References on the Task may not be loaded
projectWithTasks.tasks[0].subtasks; // MaybeLoaded<ListOfTasks>
// CoTexts are CoValues too
projectWithTasks.tasks[0].description; // MaybeLoaded<CoPlainText>

```

We can also build a query that _deeply resolves_ to multiple levels:

```ts
const projectDeep = await Project.load(projectId, {
  resolve: {
    tasks: {
      $each: {
        subtasks: {
          $each: true,
        },
        description: true,
      },
    },
  },
});
if (!projectDeep.$isLoaded)
  throw new Error("Project not found or not accessible");

// Primitive fields are always loaded
projectDeep.tasks[0].subtasks[0].title; // string

// The description will be loaded as well
projectDeep.tasks[0].description; // CoPlainText

```

**Warning: Always load data explicitly** 

If you access a reference that wasn't included in your `resolve` query, you may find that it is already loaded, potentially because some other part of your app has already loaded it. **You should not rely on this**.

Expecting data to be there which is not explicitly included in your `resolve` query can lead to subtle, hard-to-diagnose bugs. Always include every nested CoValue you need to access in your `resolve` query.

### Where To Use Resolve Queries

The syntax for resolve queries is shared throughout Jazz. As well as using them in `load` and `subscribe` method calls, you can pass a resolve query to a front-end hook.

```tsx
const projectId = "";
const projectWithTasksShallow = useCoState(Project, projectId, {
  resolve: {
    tasks: true,
  },
});

```

You can also specify resolve queries at the schema level, using the `.resolved()` method. These queries will be used when loading CoValues from that schema (if no resolve query is provided by the user) and in types defined with [co.loaded](/docs/core-concepts/subscription-and-loading#type-safety-with-coloaded).

```ts
const TaskWithDescription = Task.resolved({
  description: true,
});
const ProjectWithTasks = Project.resolved({
  tasks: {
    // Use `.resolveQuery` to get the resolve query from a schema and compose it in other queries
    $each: TaskWithDescription.resolveQuery,
  }
});

// .load() will use the resolve query from the schema
const project = await ProjectWithTasks.load(projectId);
if (!project.$isLoaded) throw new Error("Project not found or not accessible");
// Both the tasks and the descriptions are loaded
project.tasks[0].description; // CoPlainText

```

## Loading Errors

A load operation will be successful **only** if all references requested (both optional and required) could be successfully loaded. If any reference cannot be loaded, the entire load operation will return a not-loaded CoValue to avoid potential inconsistencies.

```ts
// If permissions on description are restricted:
const task = await Task.load(taskId, {
  resolve: { description: true },
});
task.$isLoaded; // false
task.$jazz.loadingState; // "unauthorized"

```

This is also true if **any** element of a list is inaccessible, even if all the others can be loaded.

```ts
// One task in the list has restricted permissions
const projectWithUnauthorizedTasks = await Project.load(projectId, {
  resolve: { tasks: { $each: true } },
});

project.$isLoaded; // false
project.$jazz.loadingState; // "unauthorized"

```

Loading will be successful if all requested references are loaded. Non-requested references may or may not be available.

```ts
// One task in the list has restricted permissions
const shallowlyLoadedProjectWithUnauthorizedTasks = await Project.load(
  projectId,
  {
    resolve: true,
  },
);
if (!project.$isLoaded) throw new Error("Project not found or not accessible");

// Assuming the user has permissions on the project, this load will succeed, even if the user cannot load one of the tasks in the list
project.$isLoaded; // true
// Tasks may not be loaded since we didn't request them
project.tasks.$isLoaded; // may be false

```

### Catching loading errors

We can use `$onError` to handle cases where some data you have requested is inaccessible, similar to a `try...catch` block in your query.

For example, in case of a `project` (which the user can access) with three `task` items:

| Task | User can access task? | User can access task.description? |
| ---- | --------------------- | --------------------------------- |
| 0    | ✅                     | ✅                                 |
| 1    | ✅                     | ❌                                 |
| 2    | ❌                     | ❌                                 |

#### Scenario 1: Skip Inaccessible List Items

If some of your list items may not be accessible, you can skip loading them by specifying `$onError: 'catch'`. Inaccessible items will be not-loaded CoValues, while accessible items load properly.

```ts
// Inaccessible tasks will not be loaded, but the project will
const projectWithInaccessibleSkipped = await Project.load(projectId, {
  resolve: { tasks: { $each: { $onError: "catch" } } },
});

if (!project.$isLoaded) {
  throw new Error("Project not found or not accessible");
}

if (!project.tasks.$isLoaded) {
  throw new Error("Task List not found or not accessible");
}

project.tasks[0].$isLoaded; // true
project.tasks[1].$isLoaded; // true
project.tasks[2].$isLoaded; // false (caught by $onError)

```

#### Scenario 2: Handling Inaccessible Nested References

An `$onError` applies only in the block where it's defined. If you need to handle multiple potential levels of error, you can nest `$onError` handlers.

This load will fail, because the `$onError` is defined only for the `task.description`, not for failures in loading the `task` itself.

```ts
// Inaccessible tasks will not be loaded, but the project will
const projectWithNestedInaccessibleSkipped = await Project.load(projectId, {
  resolve: {
    tasks: {
      $each: {
        description: true,
        $onError: "catch",
      },
    },
  },
});

if (!project.$isLoaded) {
  throw new Error("Project not found or not accessible");
}

project.tasks[0].$isLoaded; // true
project.tasks[1].$isLoaded; // true
project.tasks[2].$isLoaded; // false (caught by $onError)

```

We can fix this by adding handlers at both levels

```ts
const projectWithMultipleCatches = await Project.load(projectId, {
  resolve: {
    tasks: {
      $each: {
        description: { $onError: "catch" }, // catch errors loading task descriptions
        $onError: "catch", // catch errors loading tasks too
      },
    },
  },
});

project.$isLoaded; // true
project.tasks[0].$isLoaded; // true
project.tasks[0].description.$isLoaded; // true
project.tasks[1].$isLoaded; // true
project.tasks[1].description.$isLoaded; // false (caught by the inner handler)
project.tasks[2].$isLoaded; // false (caught by the outer handler)

```

## Type safety with co.loaded

You can tell your application how deeply your data is loaded by using the `co.loaded` type.

The `co.loaded` type is especially useful when passing data between components, because it allows TypeScript to check at compile time whether data your application depends is properly loaded. The second argument lets you pass a `resolve` query to specify how deeply your data is loaded.

```tsx
import { co } from "jazz-tools";
import { Project } from "./schema";

type ProjectWithTasks = co.loaded<
  typeof Project,
  {
    tasks: {
      $each: true;
    };
  }
>;

// In case the project prop isn't loaded as required, TypeScript will warn
function TaskList({ project }: { project: ProjectWithTasks }) {
  // TypeScript knows tasks are loaded, so this is type-safe
  return (
    <ul>
      {project.tasks.map((task) => (
        <li key={task.$jazz.id}>{task.title}</li>
      ))}
    </ul>
  );
}

```

You can pass a `resolve` query of any complexity to `co.loaded`.

## Manual subscriptions

If you have a CoValue's ID, you can subscribe to it anywhere in your code using `CoValue.subscribe()`.

**Note:** Manual subscriptions are best suited for vanilla JavaScript — for example in server-side code or tests. Inside front-end components, we recommend using a subscription hook.

```ts
// Subscribe by ID
const unsubscribe = Task.subscribe(taskId, {}, (updatedTask) => {
  console.log("Updated task:", updatedTask);
});

// Always clean up when finished
unsubscribe();

```

You can also subscribe to an existing CoValue instance using the `$jazz.subscribe` method.

```ts
const myTask = Task.create({
  title: "My new task",
});

// Subscribe using $jazz.subscribe
const unsubscribe = myTask.$jazz.subscribe((updatedTask) => {
  console.log("Updated task:", updatedTask);
});

// Always clean up when finished
unsubscribe();

```

## Selectors \[!framework=react,react-native,react-native-expo\]

Sometimes, you only need to react to changes in specific parts of a CoValue. In those cases, you can provide a `select` function to specify what data you are interested in, and an optional `equalityFn` option to control re-renders.

* `select`: extract the fields you care about
* `equalityFn`: (optional) control when data should be considered equal

```tsx
function ProjectViewWithSelector({ projectId }: { projectId: string }) {
  // Subscribe to a project
  const project = useCoState(Project, projectId, {
    resolve: {
      tasks: true,
    },
    select: (project) => {
      if (!project.$isLoaded) return {
        loadingState: project.$jazz.loadingState
      };
      return {
        name: project.name,
        taskCount: project.tasks.length,
        loadingState: project.$jazz.loadingState
      };
    },
    // Only re-render if the name or the number of tasks change
    equalityFn: (a, b) => {
      if (a.loadingState !== 'loaded' || b.loadingState !== 'loaded') return false;

      return a?.name === b?.name && a?.taskCount === b?.taskCount;
    },
  });

  switch (project.loadingState) {
    case "unauthorized":
      return "Project not accessible";
    case "unavailable":
      return "Project not found";
    case "loading":
      return "Loading...";
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <small>{project.taskCount} task(s)</small>
    </div>
  );
}

```

By default, the return values of the select function will be compared using `Object.is`, but you can use the `equalityFn` to add your own logic.

You can also use `useAccount` in the same way, to subscribe to only the changes in a user's account you are interested in.

```tsx
import { useAccount } from "jazz-tools/react";

function ProfileName() {
  // Only re-renders when the profile name changes
  const profileName = useAccount(MyAppAccount, {
    resolve: {
      profile: true,
    },
    select: (account) =>
      account.$isLoaded ? account.profile.name : "Loading...",
  });

  return <div>{profileName}</div>;
}

```

### Avoiding Expensive Selectors

Selector functions optimise re-renders by only updating React state if the underlying CoValue has changed in a way that you care about.

However, the selector function itself still runs on every CoValue update, even if your `equalityFn` returns `true` and your component does not re-render. Because of this, you should **avoid doing expensive computation inside a selector**.

For expensive operations, use a lightweight selector which only tracks the minimum necessary to identify when the dependencies change, and run the expensive operations separately, wrapped in a `useMemo` hook.

This way, React can [batch state updates efficiently](https://react.dev/learn/queueing-a-series-of-state-updates) and only recompute the expensive memoised operation if the dependencies have changed.

```tsx
function ProjectViewWithExpensiveOperations({ projectId }: { projectId: string }) {
  const project = useCoState(Project, projectId, {
    resolve: {
      tasks: {
        $each: true,
      }
    },
    select: (project) => {
      if (!project.$isLoaded) return {
        loadingState: project.$jazz.loadingState,
        tasks: [],
        taskIds: []
      };
      return {
        name: project.name,
        tasks: project.tasks,
        loadingState: project.$jazz.loadingState
      };
    },
    equalityFn: (a, b) => {
      if (a.loadingState !== 'loaded' || b.loadingState !== 'loaded') return false;
      if (a.name !== b.name) return false;
      if (a.tasks.length !== b.tasks.length) return false;
      const aTaskIds = new Set(a.tasks.map(t => t.$jazz.id));
      return b.tasks.every(t => aTaskIds.has(t.$jazz.id));
    },
  });

  const tasksAfterExpensiveComputations = useMemo(() => {
    const sortedTasks = project.tasks.slice(0).sort(someExpensiveSortFunction);
    const groupedTasks = sortedTasks.reduce(someExpensiveReduceFunction, {});
    return groupedTasks;
  }, [project.tasks]);


  switch (project.loadingState) {
    case "unauthorized":
      return "Project not accessible";
    case "unavailable":
      return "Project not found";
    case "loading":
      return "Loading...";
  }


  return (
    <div>
      <h1>{project.name}</h1>
      <GroupedTaskDisplay tasks={tasksAfterExpensiveComputations} />
    </div>
  );
}

```

## Ensuring data is loaded

In most cases, you'll have specified the depth of data you need in a `resolve` query when you first load or subscribe to a CoValue. However, sometimes you might have a CoValue instance which is not loaded deeply enough, or you're not sure how deeply loaded it is. In this case, you need to make sure data is loaded before proceeding with an operation. The `$jazz.ensureLoaded` method lets you guarantee that a CoValue and its referenced data are loaded to a specific depth (i.e. with nested references resolved):

```ts
async function completeAllTasks(projectId: string) {
  // Load the project
  const project = await Project.load(projectId, { resolve: true });
  if (!project.$isLoaded) return;

  // Ensure tasks are deeply loaded
  const loadedProject = await project.$jazz.ensureLoaded({
    resolve: {
      tasks: {
        $each: true,
      },
    },
  });

  // Now we can safely access and modify tasks
  loadedProject.tasks.forEach((task, i) => {
    task.$jazz.set("title", `Task ${i}`);
  });
}

```

This can be useful if you have a shallowly loaded CoValue instance, and would like to load its references deeply.

## Best practices

* Load exactly what you need. Start shallow and add your nested references with care.
* Always check `$isLoaded` before accessing CoValue data. Use `$jazz.loadingState` for more detailed information.
* Use `$onError: 'catch'` at each level of your query that can fail to handle inaccessible data gracefully.
* Use selectors and an `equalityFn` to prevent unnecessary re-renders.
* Never rely on data being present unless it is requested in your `resolve` query.


### Sync and storage
# Sync and storage: Jazz Cloud or self-hosted

For sync and storage, you can either use Jazz Cloud for zero-config magic, or run your own sync server.

## Using Jazz Cloud

Sign up for a free API key at [dashboard.jazz.tools](https://dashboard.jazz.tools) for higher limits or production use, or use your email address as a temporary key to get started quickly.

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY="you@example.com" # or your API key

```

Replace the API key in the Jazz provider sync server URL with your API key:

```tsx
export function MyApp({ children }: { children: React.ReactNode }) {
  // Get a free API Key at dashboard.jazz.tools, or use your email as a temporary key.
  const apiKey = "you@example.com";
  return (
    <JazzReactProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        // ...
      }}
    >
      {children}
    </JazzReactProvider>
  );
}

```

Jazz Cloud will

* sync CoValues in real-time between users and devices
* safely persist CoValues on redundant storage nodes with additional backups
* make use of geographically distributed cache nodes for low latency

### Free public alpha

* Jazz Cloud is free during the public alpha, with no strict usage limits
* We plan to keep a free tier, so you'll always be able to get started with zero setup
* See [Jazz Cloud pricing](/cloud#pricing) for more details

## Self-hosting your sync server

You can run your own sync server using:

```sh
npx jazz-run sync

```

And then use `ws://localhost:4200` as the sync server URL.

You can also run this simple sync server behind a proxy that supports WebSockets, for example to provide TLS. In this case, provide the WebSocket endpoint your proxy exposes as the sync server URL.

**Info:** 

Requires at least Node.js v20\. See our [Troubleshooting Guide](/docs/troubleshooting) for quick fixes.

### Command line options:

* `--host` / `-h` \- the host to run the sync server on. Defaults to 127.0.0.1.
* `--port` / `-p` \- the port to run the sync server on. Defaults to 4200.
* `--in-memory` \- keep CoValues in-memory only and do sync only, no persistence. Persistence is enabled by default.
* `--db` \- the path to the file where to store the data (SQLite). Defaults to `sync-db/storage.db`.

### Source code

The implementation of this simple sync server is available open-source [on GitHub](https://github.com/garden-co/jazz/blob/main/packages/jazz-run/src/startSyncServer.ts).


## Key Features

### Overview
# Authentication in Jazz

Jazz authentication is based on cryptographic keys ("Account keys"). Their public part represents a user's identity, their secret part lets you act as that user.

## Authentication Flow

When a user first opens your app, they'll be in one of these states:

* **Anonymous Authentication**: Default starting point where Jazz automatically creates a local account on first visit. Data persists on one device and can be upgraded to a full account.
* **Authenticated Account**: Full account accessible across multiple devices using [passkeys](/docs/key-features/authentication/passkey), [passphrases](/docs/key-features/authentication/passphrase), or third-party authentications, such as [Clerk](/docs/key-features/authentication/clerk).
* **Guest Mode**: No account, read-only access to public content. Users can browse but can't save data or sync.

Learn more about these states in the [Authentication States](/docs/key-features/authentication/authentication-states) documentation.

Without authentication, users are limited to using the application on only one device.

When a user logs out of an Authenticated Account, they return to the Anonymous Authentication state with a new local account.

Here's what happens during registration and login:

* **Register**: When a user registers with an authentication provider, their Anonymous account credentials are stored in the auth provider, and the account is marked as Authenticated. The user keeps all their existing data.
* **Login**: When a user logs in with an authentication provider, their Anonymous account is discarded and the credentials are loaded from the auth provider. Data from the Anonymous account can be transferred using the [onAnonymousAccountDiscarded handler](/docs/key-features/authentication/authentication-states#migrating-data-from-anonymous-to-authenticated-account).

## Available Authentication Methods

Jazz provides several ways to authenticate users:

* [**Passkeys**](/docs/key-features/authentication/passkey): Secure, biometric authentication using WebAuthn
* [**Passphrases**](/docs/key-features/authentication/passphrase): Bitcoin-style word phrases that users store
* [**Clerk Integration**](/docs/key-features/authentication/clerk): Third-party authentication service with OAuth support
* [**Better Auth**](/docs/key-features/authentication/better-auth): Self-hosted authentication service

**Note**: For serverless authentication methods (passkey, passphrase), Jazz stores your account's credentials in your browser's local storage. This avoids needing to reauthenticate on every page load, but means you must take extra care to avoid [XSS attacks](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS). In particular, you should take care to [sanitise user input](https://github.com/cure53/DOMPurify), set [appropriate CSP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), and avoid third-party JavaScript wherever possible.


### Quickstart
# Add Authentication to your App

This guide will show you how you can access your data on multiple devices by signing in to your app.

**Info:** 

If you haven't gone through the [front-end Quickstart](/docs/quickstart), you might find this guide a bit confusing. If you're looking for a quick reference, you might find [this page](/docs/key-features/authentication/overview) or our [Passkey Auth example app](https://github.com/gardencmp/jazz/tree/main/starters/react-passkey-auth) more helpful!

## Add passkey authentication

Jazz has a built-in passkey authentication component that you can use to add authentication to your app. This is the easiest way to get started with securely authenticating users into your application. By adding this component, when users access your app, they'll be greeted with an input where they can enter their name, and create a passkey.

**File name: app/components/JazzWrapper.tsx**

```tsx
"use client"; // tells Next.js that this component can't be server-side rendered. If you're not using Next.js, you can remove it.
// [!code --:1]
import { JazzReactProvider } from "jazz-tools/react";
// [!code ++:1]
import { JazzReactProvider, PasskeyAuthBasicUI } from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export function JazzWrapper({ children }: { children: React.ReactNode }) {
return (
  <JazzReactProvider
    sync={{
      peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    }}
    AccountSchema={JazzFestAccount}
  >
    {/* [!code ++:1] */}
    <PasskeyAuthBasicUI appName="JazzFest">
      {children}
      {/* [!code ++:1] */}
    </PasskeyAuthBasicUI>
  </JazzReactProvider>
);
}

```

Already completed the server-side rendering guide?

You'll need to make a couple of small changes to your structure in order for this to work on the server. In particular, we only want to display the passkey auth UI on the client, otherwise, we should just render on the child.

**File name: app/components/JazzWrapper.tsx**

```tsx
"use client"; // tells Next.js that this component can't be server-side rendered. If you're not using Next.js, you can remove it.
// [!code --:1]
import { JazzReactProvider, PasskeyAuthBasicUI } from "jazz-tools/react";
// [!code ++:1]
import {
  JazzReactProvider,
  PasskeyAuthBasicUI,
  useAgent,
} from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export function JazzWrapper({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
      }}
      AccountSchema={JazzFestAccount}
      enableSSR
    >
      {/* [!code --:3] */}
      <PasskeyAuthBasicUI appName="JazzFest">{children}</PasskeyAuthBasicUI>
      {/* [!code ++:1] */}
      <Auth>{children}</Auth>
    </JazzReactProvider>
  );
}

// [!code ++:10]
export function Auth({ children }: { children: React.ReactNode }) {
  const agent = useAgent();
  const isGuest = agent.$type$ !== "Account";
  if (isGuest) return children;
  return <PasskeyAuthBasicUI appName="JazzFest">{children}</PasskeyAuthBasicUI>;
}

```

You'll also need to be aware that the server agent can only render public CoValues.

## Give it a go!

... what, already?! Yes! Run your app and try creating a passkey and logging in!

```bash
npm run dev

```

### Not working?

* Did you add `<PasskeyAuthBasicUI>` _inside_ your provider?
* Does it wrap all the children?
* Are you running your app in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure%5FContexts) (either HTTPS or localhost)?

**Info: Still stuck?** Ask for help on [Discord](https://discord.gg/utDMjHYg42)!

## Add a recovery method

Passkeys are very convenient for your users because they offer a secure alternative to traditional authentication methods and they're normally synchronised across devices automatically by the user's browser or operating system.

However, they're not available everywhere, and in case the user loses or deletes their passkey by mistake, they won't be able to access their account.

So, let's add a secondary login method using a passphrase. You can integrate [as many different authentication methods as you like](https://github.com/garden-co/jazz/tree/main/examples/multiauth) in your app.

### Create an `Auth` component

The `PasskeyAuthBasicUI` component is not customisable, so we'll implement our own Auth component so that we can extend it.

**File name: app/components/Auth.tsx**

```tsx
import { useState } from "react";
import { usePasskeyAuth } from "jazz-tools/react";

export function Auth({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");

  const auth = usePasskeyAuth({
    // Must be inside the JazzProvider because the hook depends on an active Jazz context.
    appName: "JazzFest",
  });

  return (
    <>
      <div>
        <button onClick={() => auth.logIn()}>Log in</button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => auth.signUp(name)}>Sign up</button>
      </div>
      {auth.state === "signedIn" && children}
    </>
  );
}

```

### Use your new component

**File name: app/components/JazzWrapper.tsx**

```tsx
"use client"; // tells Next.js that this component can't be server-side rendered. If you're not using Next.js, you can remove it.
// [!code --:1]
import { JazzReactProvider, PasskeyAuthBasicUI } from "jazz-tools/react";
// [!code ++:1]
import { JazzReactProvider } from "jazz-tools/react";
import { Auth } from "./Auth.tsx";
import { JazzFestAccount } from "@/app/schema";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export function JazzWrapper({ children }: { children: React.ReactNode }) {
return (
  <JazzReactProvider
    sync={{
      peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    }}
    AccountSchema={JazzFestAccount}
  >
    {/* [!code ++:3] */}
    <Auth>{children}</Auth>
    {/* [!code --:3] */}
    <PasskeyAuthBasicUI appName="JazzFest">{children}</PasskeyAuthBasicUI>
  </JazzReactProvider>
);
}

```

### Show recovery key

Jazz allows you to generate a passphrase from a wordlist which can be used to log in to an account. This passphrase will work regardless of how the account was originally created (passkey, Clerk, BetterAuth, etc.). Each account will always have the same recovery key.

You can get started with a wordlist [from here](https://github.com/bitcoinjs/bip39/tree/master/src/wordlists). For example, you could save the `english.json` file in your project and format it as a JavaScript export.

**File name: wordlist.ts**

```ts
export const wordlist = [
  "abandon",
  // ... many more words
  "zoo"
];

```

We'll import this, and add a textarea into our auth component which will show the recovery key for the current user's account.

```tsx
import { useState } from "react";
// [!code --:1]
import { usePasskeyAuth } from "jazz-tools/react";
// [!code ++:2]
import { usePasskeyAuth, usePassphraseAuth } from "jazz-tools/react";
import { wordlist } from "./wordlist"; // or the path to your wordlist

export function Auth({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");

  const auth = usePasskeyAuth({
    // Must be inside the JazzProvider because the hook depends on an active Jazz context.
    appName: "JazzFest",
  });

  // [!code ++:1]
  const passphraseAuth = usePassphraseAuth({ wordlist }); // This should be inside the provider too

  return (
    <>
      <div>
        <button onClick={() => auth.logIn()}>Log in</button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => auth.signUp(name)}>Sign up</button>
      </div>
      {auth.state === "signedIn" && (
        <>
          {children}
          {/* [!code ++:5]*/}
          <textarea readOnly value={passphraseAuth.passphrase} rows={5} />
        </>
      )}
    </>
  );
}

```

**Warning: Security Warning** 

This 'recovery key' is a method of authenticating into an account, and if compromised, it _cannot_ be changed! You should impress on your users the importance of keeping this key secret.

### Allow users to log in with the recovery key

Now you're displaying a recovery key to users, so we'll allow users to login using a saved recovery key by extending the Auth component a little further.

```tsx
import { useState } from "react";
import { usePasskeyAuth, usePassphraseAuth } from "jazz-tools/react";
import { wordlist } from "./wordlist"; // or the path to your wordlist

export function Auth({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  // [!code ++:1]
  const [passphraseInput, setPassphraseInput] = useState("");

  const auth = usePasskeyAuth({
    // Must be inside the JazzProvider because the hook depends on an active Jazz context.
    appName: "JazzFest",
  });

  const passphraseAuth = usePassphraseAuth({ wordlist }); // This should be inside the provider too

  return (
    <>
      <div>
        <button onClick={() => auth.logIn()}>Log in</button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => auth.signUp(name)}>Sign up</button>
      </div>
      {auth.state === "signedIn" && (
        <>
          {children}
          <textarea readOnly value={passphraseAuth.passphrase} rows={5} />
        </>
      )}
      {/* [!code ++:8]*/}
      {auth.state !== "signedIn" && (
        <>
          <textarea
            onChange={(e) => setPassphraseInput(e.target.value)}
            rows={5}
          />
          <button onClick={() => passphraseAuth.logIn(passphraseInput)}>
            Sign In with Passphrase
          </button>
        </>
      )}
    </>
  );
}

```

**Info: Tip** 

Although we're presenting this as a 'recovery key' here, this key could also be used as the primary method of authenticating users into your app. You could even completely remove passkey support if you wanted.

**Congratulations! 🎉** You've added authentication to your app, allowing your users to log in from multiple devices, and you've added a recovery method, allowing users to make sure they never lose access to their account.

## Next steps

* Check out how to [use other types of authentication](/docs/key-features/authentication/overview#available-authentication-methods)
* Learn more about [sharing and collaboration](/docs/permissions-and-sharing/quickstart)
* Find out how to [use server workers](/docs/server-side/quickstart) to build more complex applications


### Authentication States
# Authentication States

Jazz provides three distinct authentication states that determine how users interact with your app: **Anonymous Authentication**, **Guest Mode**, and **Authenticated Account**.

## Anonymous Authentication

When a user loads a Jazz application for the first time, we create a new Account by generating keys and storing them locally:

* Users have full accounts with unique IDs
* Data persists between sessions on the same device
* Can be upgraded to a full account (passkey, passphrase, etc.)
* Data syncs across the network (if enabled)

## Authenticated Account

**Authenticated Account** provides full multi-device functionality:

* Persistent identity across multiple devices
* Full access to all application features
* Data can sync across all user devices
* Multiple authentication methods available

## Guest Mode

**Guest Mode** provides a completely accountless context:

* No persistent identity or account
* Only provides access to publicly readable content
* Cannot save or sync user-specific data
* Suitable for read-only access to public resources

## Detecting Authentication State

You can detect the current authentication state using `useAgent` and `useIsAuthenticated`.

```tsx
import { useAgent, useIsAuthenticated } from "jazz-tools/react";

function AuthStateIndicator() {
  const agent = useAgent();
  const isAuthenticated = useIsAuthenticated();

  // Check if guest mode is enabled in JazzReactProvider
  const isGuest = agent.$type$ !== "Account";

  // Anonymous authentication: has an account but not fully authenticated
  const isAnonymous = agent.$type$ === "Account" && !isAuthenticated;
  return (
    <div>
      {isGuest && <span>Guest Mode</span>}
      {isAnonymous && <span>Anonymous Account</span>}
      {isAuthenticated && <span>Authenticated</span>}
    </div>
  );
}

```

## Migrating data from anonymous to authenticated account

When a user signs up, their anonymous account is transparently upgraded to an authenticated account, preserving all their data.

However, if a user has been using your app anonymously and later logs in with an existing account, their anonymous account data would normally be discarded. To prevent data loss, you can use the `onAnonymousAccountDiscarded` handler.

This example from our [music player example app](https://github.com/garden-co/jazz/tree/main/examples/music-player) shows how to migrate data:

```ts
export async function onAnonymousAccountDiscarded(
  anonymousAccount: MusicaAccount,
) {
  const { root: anonymousAccountRoot } =
    await anonymousAccount.$jazz.ensureLoaded({
      resolve: {
        root: {
          rootPlaylist: {
            tracks: {
              $each: true,
            },
          },
        },
      },
    });

  const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        rootPlaylist: {
          tracks: true,
        },
      },
    },
  });

  for (const track of anonymousAccountRoot.rootPlaylist.tracks) {
    if (track.isExampleTrack) continue;

    const trackGroup = track.$jazz.owner;
    trackGroup.addMember(me, "admin");

    me.root.rootPlaylist.tracks.$jazz.push(track);
  }
}

```

To see how this works, try uploading a song in the [music player demo](https://music.demo.jazz.tools/) and then log in with an existing account.

## Provider Configuration for Authentication

You can configure how authentication states work in your app with the [JazzReactProvider](/docs/project-setup/providers/). The provider offers several options that impact authentication behavior:

* `guestMode`: Enable/disable Guest Mode
* `onAnonymousAccountDiscarded`: Handle data migration when switching accounts
* `sync.when`: Control when data synchronization happens
* `defaultProfileName`: Set default name for new user profiles

For detailed information on all provider options, see [Provider Configuration options](/docs/project-setup/providers/#additional-options).

## Controlling sync for different authentication states

You can control network sync with [Providers](/docs/project-setup/providers/) based on authentication state:

* `when: "always"`: Sync is enabled for both Anonymous Authentication and Authenticated Account
* `when: "signedUp"`: Sync is enabled when the user is authenticated
* `when: "never"`: Sync is disabled, content stays local

```tsx
<JazzReactProvider
  sync={{
    peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    // Controls when sync is enabled for
    // both Anonymous Authentication and Authenticated Account
    when: "always", // or "signedUp" or "never"
  }}
>
  <App />
</JazzReactProvider>

```

### Disable sync for Anonymous Authentication

You can disable network sync to make your app local-only under specific circumstances.

For example, you may want to give users with Anonymous Authentication the opportunity to try your app locally-only (incurring no sync traffic), then enable network sync only when the user is fully authenticated.

```tsx
<JazzReactProvider
  sync={{
    peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    // This makes the app work in local mode when using Anonymous Authentication
    when: "signedUp",
  }}
>
  <App />
</JazzReactProvider>

```

### Configuring Guest Mode Access \[!framework=react,react-native,react-native-expo,svelte\]

You can configure Guest Mode access with the `guestMode` prop for [Providers](/docs/project-setup/providers/).

```tsx
<JazzReactProvider
  // Enable Guest Mode for public content
  guestMode={true}
  sync={{
    peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    // Only sync for authenticated users
    when: "signedUp",
  }}
>
  <App />
</JazzReactProvider>

```

For more complex behaviours, you can manually control sync by statefully switching when between `"always"` and `"never"`.


### Passkey
# Passkey Authentication

Passkey authentication is fully local-first and the most secure of the auth methods that Jazz provides because keys are managed by the device/operating system itself.

## How it works

Passkey authentication is based on the [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web%5FAuthentication%5FAPI) and uses familiar FaceID/TouchID flows that users already know how to use.

## Key benefits

* **Most secure**: Keys are managed by the device/OS
* **User-friendly**: Uses familiar biometric verification (FaceID/TouchID)
* **Cross-device**: Works across devices with the same biometric authentication
* **No password management**: Users don't need to remember or store anything
* **Wide support**: Available in most modern browsers

## Implementation

Using passkeys in Jazz is as easy as this:

```tsx
export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [username, setUsername] = useState("");

  const auth = usePasskeyAuth({
    // Must be inside the JazzProvider!
    appName: "My super-cool web app",
  });

  if (auth.state === "signedIn") {
    // You can also use `useIsAuthenticated()`
    return <div>You are already signed in</div>;
  }

  const handleSignUp = async () => {
    await auth.signUp(username);
    onOpenChange(false);
  };

  const handleLogIn = async () => {
    await auth.logIn();
    onOpenChange(false);
  };

  return (
    <div>
      <button onClick={handleLogIn}>Log in</button>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign up</button>
    </div>
  );
}

```

## Examples

You can try passkey authentication using our [passkey example](https://passkey.demo.jazz.tools/) or the [music player demo](https://music.demo.jazz.tools/).

## When to use Passkeys

Passkeys are ideal when:

* Security is a top priority
* You want the most user-friendly authentication experience
* You're targeting modern browsers and devices
* You want to eliminate the risk of password-based attacks

## Limitations and considerations

* Requires hardware/OS support for biometric authentication
* Not supported in older browsers (see browser support below)
* Requires a fallback method for unsupported environments

### Browser Support

[Passkeys are supported in most modern browsers](https://caniuse.com/passkeys).

For older browsers, we recommend using [passphrase authentication](/docs/key-features/authentication/passphrase) as a fallback.

## Additional resources

For more information about the Web Authentication API and passkeys:

* [WebAuthn.io](https://webauthn.io/)
* [MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web%5FAuthentication%5FAPI)


### Passphrase
# Passphrase Authentication

Passphrase authentication lets users log into any device using a recovery phrase consisting of multiple words (similar to cryptocurrency wallets). Users are responsible for storing this passphrase safely.

## How it works

When a user creates an account with passphrase authentication:

1. Jazz generates a unique recovery phrase derived from the user's cryptographic keys
2. This phrase consists of words from a wordlist
3. Users save this phrase and enter it when logging in on new devices

You can use one of the ready-to-use wordlists from the [BIP39 repository](https://github.com/bitcoinjs/bip39/tree/a7ecbfe2e60d0214ce17163d610cad9f7b23140c/src/wordlists) or create your own. If you do decide to create your own wordlist, it's recommended to use at least 2048 unique words (or some higher power of two).

## Key benefits

* **Portable**: Works across any device, even without browser or OS support
* **User-controlled**: User manages their authentication phrase
* **Flexible**: Works with any wordlist you choose
* **Offline capable**: No external dependencies

## Implementation

You can implement passphrase authentication in your application quickly and easily:

```tsx
import { wordlist } from "./wordlist";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [loginPassphrase, setLoginPassphrase] = useState("");

  const auth = usePassphraseAuth({
    // Must be inside the JazzProvider!
    wordlist: wordlist,
  });

  if (auth.state === "signedIn") {
    // You can also use `useIsAuthenticated()`
    return <div>You are already signed in</div>;
  }

  const handleSignUp = async () => {
    await auth.signUp();
    onOpenChange(false);
  };

  const handleLogIn = async () => {
    await auth.logIn(loginPassphrase);
    onOpenChange(false);
  };

  return (
    <div>
      <label>
        Your current passphrase
        <textarea readOnly value={auth.passphrase} rows={5} />
      </label>
      <button onClick={handleSignUp}>I have stored my passphrase</button>
      <label>
        Log in with your passphrase
        <textarea
          value={loginPassphrase}
          onChange={(e) => setLoginPassphrase(e.target.value)}
          placeholder="Enter your passphrase"
          rows={5}
          required
        />
      </label>
      <button onClick={handleLogIn}>Log in</button>
    </div>
  );
}

```

## Examples

You can see passphrase authentication in our [passphrase example](https://passphrase.demo.jazz.tools/) or the [todo list demo](https://todo.demo.jazz.tools/).

## When to use Passphrases

Passphrase authentication is ideal when:

* You need to support older browsers without WebAuthn capabilities
* Your users need to access the app on many different devices
* You want a fallback authentication method alongside passkeys

## Limitations and considerations

* **User responsibility**: Users must securely store their passphrase
* **Recovery concerns**: If a user loses their passphrase, they cannot recover their account
* **Security risk**: Anyone with the passphrase can access the account
* **User experience**: Requires users to enter a potentially long phrase

Make sure to emphasize to your users:

1. Store the passphrase in a secure location (password manager, written down in a safe place)
2. The passphrase is the only way to recover their account
3. Anyone with the passphrase can access the account


### Clerk


### Better Auth
# Better Auth authentication

[Better Auth](https://better-auth.com/) is a self-hosted, framework-agnostic authentication and authorisation framework for TypeScript.

You can integrate Better Auth with your Jazz app, allowing your Jazz user's account keys to be saved with the corresponding Better Auth user.

## How it works

When using Better Auth authentication:

1. Users sign up or sign in through Better Auth's authentication system
2. Jazz securely stores the user's account keys with Better Auth
3. When logging in, Jazz retrieves these keys from Better Auth
4. Once authenticated, users can work offline with full Jazz functionality

This authentication method is not fully local-first, as login and signup need to be done online, but once authenticated, users can use all of Jazz's features without needing to be online.

## Authentication methods and plugins

Better Auth supports several authentication methods and plugins. The Jazz plugin has not been tested with all of them yet. Here is the compatibility matrix:

| Better Auth method/plugin | Jazz plugin |
| ------------------------- | ----------- |
| Email/Password            | ✅           |
| Social Providers          | ✅           |
| Username                  | ❓           |
| Anonymous                 | ❓           |
| Phone Number              | ❓           |
| Magic Link                | ❓           |
| Email OTP                 | ✅           |
| Passkey                   | ❓           |
| One Tap                   | ❓           |

✅: tested and working ❓: not tested yet ❌: not supported

## Getting started

First of all, follow the [Better Auth documentation](https://www.better-auth.com/docs/installation) to install Better Auth:

* Install the dependency and set env variables
* Create the betterAuth instance in the common `auth.ts` file, using the database adapter you want.
* Set up the authentication methods you want to use
* Mount the handler in the API route
* Create the client instance in the common `auth-client.ts` file

The `jazz-tools/better-auth/auth` plugin provides both server-side and client-side integration for Better Auth with Jazz. Here's how to set it up:

### Server Setup

Add the `jazzPlugin` to the Better Auth instance:

**File name: src/lib/auth.ts**

```ts
import { betterAuth } from "better-auth";
import { jazzPlugin } from "jazz-tools/better-auth/auth/server";

// Your Better Auth server configuration
export const auth = betterAuth({
  // Add the Jazz plugin
  plugins: [
    jazzPlugin(),
    // other server plugins
  ],

  // rest of the Better Auth configuration
  // like database, email/password authentication, social providers, etc.
});

export const authWithHooks = betterAuth({
  plugins: [jazzPlugin()],
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          // Here we can send a welcome email to the user
          console.log("User created with Jazz Account ID:", user.accountID);
        },
      },
    },
  },
});

```

Now run [migrations](https://www.better-auth.com/docs/concepts/database#running-migrations) to add the new fields to the users table.

**Warning: Note** 

The server-side plugin intercepts the custom header `x-jazz-auth` sent by client-side plugin. If server is behind a proxy, the header must be forwarded. If the server runs on a different origin than the client, the header must be allowed for cross-origin requests.

### Client Setup

Create the Better Auth client with the Jazz plugin:

**File name: src/lib/auth-client.ts**

```ts
"use client";

import { createAuthClient } from "better-auth/client";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";

export const betterAuthClient = createAuthClient({
  plugins: [
    jazzPluginClient(),
    // other client plugins
  ],
});

```

Wrap your app with the `AuthProvider`, passing the `betterAuthClient` instance:

```ts
"use client";

import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { betterAuthClient } from "@/lib/auth-client";

export function App() {
  return (
    /* Other providers (e.g. your Jazz Provider) */
    <AuthProvider betterAuthClient={betterAuthClient}>
      {/* your app */}
    </AuthProvider>
  );
}

```

**Warning: Important** 

The AuthProvider component uses the `better-auth/client` package, not `better-auth/react`. To verify the authentication state in your app, see [Authentication states](#authentication-states).

## Authentication methods

The Jazz plugin intercepts the Better Auth client's calls, so you can use the Better Auth [methods](https://www.better-auth.com/docs/basic-usage) as usual.

Here is how to sign up with email and password, and transform an anonymous Jazz account into a logged in user authenticated by Better Auth:

```ts
const me = Account.getMe();
await betterAuthClient.signUp.email(
  {
    email: "email@example.com",
    password: "password",
    name: "John Doe",
  },
  {
    onSuccess: async () => {
      // Don't forget to update the profile's name. It's not done automatically.
      if (me.profile.$isLoaded) {
        me.profile.$jazz.set("name", "John Doe");
      }
    },
  },
);

```

You can then use the `signIn` and `signOut` methods on the `betterAuthClient`:

```ts
await betterAuthClient.signIn.email({
  email: "email@example.com",
  password: "password",
});

await betterAuthClient.signOut();

```

## Authentication states

Although Better Auth is not fully local-first, the Jazz client plugin tries to keep Jazz's authentication state in sync with Better Auth's. The best practice to check if the user is authenticated is using Jazz's methods [as described here](/docs/key-features/authentication/authentication-states#detecting-authentication-state).

You can use Better Auth's [native methods](https://www.better-auth.com/docs/basic-usage#session) if you need to check the Better Auth state directly.

## Server-side hooks

Better Auth provides [database hooks](https://www.better-auth.com/docs/reference/options#databasehooks) to run code when things happen. When using the Jazz, the user's Jazz account ID is always available in the `user` object. This means you can access it anywhere in Better Auth hooks.

```ts
export const authWithHooks = betterAuth({
  plugins: [jazzPlugin()],
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          // Here we can send a welcome email to the user
          console.log("User created with Jazz Account ID:", user.accountID);
        },
      },
    },
  },
});

```


### Better Auth Database Adapter
# Jazz database adapter for Better Auth

The package `jazz-tools/better-auth/database-adapter` is a database adapter for Better Auth based on Jazz. Better Auth's data will be stored in CoValues encrypted by [Server Worker](/docs/server-side/setup), synced on our distributed [cloud infrastructure](/cloud).

## Getting started

1. Install and configure [Better Auth](https://www.better-auth.com/docs/installation)
2. Install Jazz package `pnpm jazz-tools`
3. Generate a [worker's credentials](/docs/server-side/setup#generating-credentials)

```bash
npx jazz-run account create --name "Better Auth Server Worker"

```

**Info: Security** 

Although all workers have the same capabilities, we recommend to use different workers for different purposes. As it will store user's credentials, the best practice is to keep it isolated from other workers.

1. Setup the database adapter on Better Auth server instance.

```ts
import { betterAuth } from "better-auth";
import { JazzBetterAuthDatabaseAdapter } from "jazz-tools/better-auth/database-adapter";
const apiKey = process.env.JAZZ_API_KEY;

const auth = betterAuth({
database: JazzBetterAuthDatabaseAdapter({
  syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  accountID: "auth-worker-account-id",
  accountSecret: "your-worker-account-secret",
}),

// other Better Auth settings
});

```

1. You're ready to use Better Auth features without managing any database by yourself!

## How it works

The adapter automatically creates Jazz schemas from Better Auth's database schema, even if not all the SQL-like features are supported yet. The database is defined as a CoMap with two properties: `group` and `tables`. The first one contains the master Group that will own all the tables; the second one is a CoMap with table names as keys and data as values.

Internally it uses specialized repository for known models like `User`, `Session` and `Verification`, to add indexes and boost performances on common operations.

## How to access the database

The easiest way to access the database is using the same Server Worker's credentials and access the table we're looking for.

```ts
import { startWorker } from "jazz-tools/worker";
import { co, z } from "jazz-tools";
const apiKey = process.env.JAZZ_API_KEY;

const worker1 = await startWorker({
  syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  accountID: process.env.WORKER_ACCOUNT_ID,
  accountSecret: process.env.WORKER_ACCOUNT_SECRET,
});

const DatabaseRoot = co.map({
  tables: co.map({
    user: co.list(
      co.map({
        name: z.string(),
        email: z.string(),
      }),
    ),
  }),
});

const db = await DatabaseRoot.loadUnique(
  "better-auth-root",
  process.env.WORKER_ACCOUNT_ID!,
  {
    resolve: {
      tables: {
        user: {
          $each: true,
        },
      },
    },
  },
);

if (db.$isLoaded) {
  console.log(db.tables.user);
}

```

## Rotating the worker's credentials

If you need to change the worker, you can create a new one and add it to the master Group.

```ts
import { Account, Group, co } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
const apiKey = process.env.JAZZ_API_KEY;

// Start the main worker and fetch database reference
const { worker } = await startWorker({
  syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  accountID: process.env.WORKER_ACCOUNT_ID,
  accountSecret: process.env.WORKER_ACCOUNT_SECRET,
});

const DatabaseRoot = co.map({
  group: Group,
  tables: co.map({}),
});

const db = await DatabaseRoot.loadUnique(
  "better-auth-root",
  process.env.WORKER_ACCOUNT_ID!,
  {
    loadAs: worker,
    resolve: {
      group: true,
      tables: true,
    },
  },
);

// Load the new worker account
const newWorkerRef = await co
  .account()
  .load(process.env.NEW_WORKER_ACCOUNT_ID!);

if (db.$isLoaded && newWorkerRef.$isLoaded) {
  // Add the new worker to the group as admin
  db.group.addMember(newWorkerRef, "admin");
  await db.group.$jazz.waitForSync();

  // Now the new worker can access the tables
  const { worker: newWorker } = await startWorker({
    syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
    accountID: process.env.NEW_WORKER_ACCOUNT_ID,
    accountSecret: process.env.NEW_WORKER_ACCOUNT_SECRET,
  });

  // Create the database root on the new worker with the same group's and tables' references
  await DatabaseRoot.upsertUnique({
    unique: "better-auth-root",
    value: {
      group: db.group,
      tables: db.tables,
    },
    owner: newWorker,
  });

  // Now the new worker can be used for the Database Adapter.

  // Don't forget to remove the old worker from the group
  db.group.removeMember(worker);
}

```

**Warning: Security** 

Rotating keys means that data stored from that point forward will be encrypted with the new key, but the old worker's secret can still read data written up until the rotation. Read more about encryption in [Server Worker](/docs/reference/encryption).

## Compatibility

The adapter generates Jazz schemas reading from Better Auth's database schema, so it should be compatible with any plugin / user's code that introduces new tables or extends the existing ones.

So far, the adapter has been tested with **Better Auth v1.3.7** with the following plugins:

| Plugin/Feature                                                                          | Compatibility |
| --------------------------------------------------------------------------------------- | ------------- |
| [Email & Password auth](https://www.better-auth.com/docs/authentication/email-password) | ✅             |
| [Social Provider auth](https://www.better-auth.com/docs/authentication/github)          | ✅             |
| [Email OTP](https://www.better-auth.com/docs/plugins/email-otp)                         | ✅             |

More features and plugins will be tested in the future.


### Overview
# Groups as permission scopes

Every CoValue has an owner, which can be a `Group` or an `Account`.

You can use a `Group` to grant access to a CoValue to **multiple users**. These users can have different roles, such as "writer", "reader" or "admin".

CoValues owned by an Account can only be accessed by that Account. Additional collaborators cannot be added, and the ownership cannot be transferred to another Account. This makes account ownership very rigid.

Creating a Group for every new CoValue is a best practice, even if the Group only has a single user in it (this is the default behavior when creating a CoValue with no explicit owner).

**Info:** 

While creating CoValues with Accounts as owners is still technically possible for backwards compatibility, it will be removed in a future release.

## Role Matrix

| Role                               | admin        | manager              | writer          | writeOnly         | reader |
| ---------------------------------- | ------------ | -------------------- | --------------- | ----------------- | ------ |
| Summary                            | Full control | Delegated management | Standard writer | Blind submissions | Viewer |
| Can add admins\*                   | ✅            | ❌                    | ❌               | ❌                 | ❌      |
| Can add/remove managers            | ✅            | ❌                    | ❌               | ❌                 | ❌      |
| Can add/remove readers and writers | ✅            | ✅                    | ❌               | ❌                 | ❌      |
| Can write                          | ✅            | ✅                    | ✅               | ✅\*\*             | ❌      |
| Can read                           | ✅            | ✅                    | ✅               | ❌\*\*\*           | ✅      |

\* `admin` users cannot be removed by anyone else, they must leave the group themselves.

\*\* `writeOnly` users can only create and edit their own updates/submissions.

\*\*\* `writeOnly` cannot read updates from other users.

## Creating a Group

Here's how you can create a `Group`.

```ts
import { Group } from "jazz-tools";

const group = Group.create();

```

The `Group` itself is a CoValue, and whoever owns it is the initial admin.

You typically add members using [public sharing](/docs/permissions-and-sharing/sharing#public-sharing) or [invites](/docs/permissions-and-sharing/sharing#invites). But if you already know their ID, you can add them directly (see below).

## Adding group members by ID

You can add group members by ID by using `co.account().load` and `Group.addMember`.

```tsx
import { co } from "jazz-tools";
const bob = await co.account().load(bobsId);

if (bob.$isLoaded) {
  group.addMember(bob, "writer");
}

```

## Changing a member's role

To change a member's role, use the `addMember` method.

```ts
if (bob.$isLoaded) {
  group.addMember(bob, "reader");
}

```

Bob just went from a writer to a reader.

**Note:** only admins and managers can change a member's role.

## Removing a member

To remove a member, use the `removeMember` method.

```ts
if (bob.$isLoaded) {
  group.removeMember(bob);
}

```

Rules:

* All roles can remove themselves
* Admins can remove all roles (except other admins)
* Managers can remove users with less privileged roles (writer, writeOnly, reader)

## Getting the Group of an existing CoValue

You can get the group of an existing CoValue by using `coValue.$jazz.owner`.

```ts
const owningGroup = existingCoValue.$jazz.owner;
const newValue = MyCoMap.create({ color: "red" }, { owner: group });

```

## Checking the permissions

You can check the permissions of an account on a CoValue by using the `canRead`, `canWrite`, `canManage` and `canAdmin` methods.

```ts
const red = MyCoMap.create({ color: "red" });
const me = co.account().getMe();

if (me.canAdmin(red)) {
  console.log("I can add users of any role");
} else if (me.canManage(red)) {
  console.log("I can share value with others");
} else if (me.canWrite(red)) {
  console.log("I can edit value");
} else if (me.canRead(red)) {
  console.log("I can view value");
} else {
  console.log("I cannot access value");
}

```

To check the permissions of another account, you need to load it first:

```ts
const blue = MyCoMap.create({ color: "blue" });
const alice = await co.account().load(alicesId);

if (alice.$isLoaded) {
  if (alice.canAdmin(blue)) {
    console.log("Alice can share value with others");
  } else if (alice.canWrite(blue)) {
    console.log("Alice can edit value");
  } else if (alice.canRead(blue)) {
    console.log("Alice can view value");
  } else {
    console.log("Alice cannot access value");
  }
}

```


### Quickstart
# Add Collaboration to your App

This guide will take your festival app to the next level by showing you how to use invite links to collaborate with others.

**Info:** 

If you haven't gone through the [front-end Quickstart](/docs/quickstart), you might find this guide a bit confusing.

## Understanding Groups

Jazz uses Groups to manage how users are able to access data. Each group member normally has one of three primary 'roles': `reader`, `writer`, or `admin`.

You can add users to groups manually, or you can use invite links to allow people to join groups themselves. Invite links work even for unauthenticated users!

## Create an invite link

Let's create an invite link that others can use to access our data. We'll create an invite link that allows others to make updates to our festival.

When we create a link, we can choose what level of permission to grant. Here, we want others to be able to collaborate, so we'll grant `writer` permissions.

**File name: app/components/Festival.tsx**

```tsx
"use client";
// [!code --:1]
import { useAccount } from "jazz-tools/react";
// [!code ++:1]
import { createInviteLink, useAccount } from "jazz-tools/react";
// [!code ++:1]
import { useState } from "react";
import { JazzFestAccount } from "@/app/schema";

export function Festival() {
  // [!code ++:1]
  const [inviteLink, setInviteLink] = useState<string>("");
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: { $each: true } } },
  });
  if (!me.$isLoaded) return null;
  // [!code ++:4]
  const inviteLinkClickHandler = () => {
    const link = createInviteLink(me.root.myFestival, "writer");
    setInviteLink(link);
  };
  return (
    // [!code ++:1]
    <>
      <ul>
        {me.root.myFestival.map((band) => (
          <li key={band.$jazz.id}>{band.name}</li>
        ))}
      </ul>
      {/* [!code ++:5] */}
      <input type="text" value={inviteLink} readOnly />
      <button onClick={inviteLinkClickHandler}>Create Invite Link</button>
    </>
  );
}

```

## Accept an invite

Now we need to set up a way for Jazz to handle the links for the users who are following them.

Jazz provides a handler which we can add to our `Festival` component to accept the invite. This will automatically fire when there's an invite link in the URL, and grant the user the right accesses.

**File name: app/components/Festival.tsx**

```tsx
"use client";
import { createInviteLink, useAccount } from "jazz-tools/react";
// [!code ++:2]
import {
  createInviteLink,
  useAcceptInvite,
  useAccount,
} from "jazz-tools/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// [!code --:1]
import { JazzFestAccount } from "@/app/schema";
// [!code ++:2]
// We need to alias the schema because our component is also named Festival
import { Festival as FestivalSchema, JazzFestAccount } from "@/app/schema";

export function Festival() {
  const [inviteLink, setInviteLink] = useState<string>("");
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: { $each: true } } },
  });
  // [!code ++:7]
  const router = useRouter();
  useAcceptInvite({
    invitedObjectSchema: FestivalSchema,
    onAccept: (festivalID: string) => {
      router.push(`/festival/${festivalID}`);
    },
  });
  if (!me.$isLoaded) return null;

  const inviteLinkClickHandler = () => {
    const link = createInviteLink(me.root.myFestival, "writer");
    setInviteLink(link);
  };
  return (
    <>
      <ul>
        {me.root.myFestival.map((band) => (
          <li key={band.$jazz.id}>{band.name}</li>
        ))}
      </ul>
      <input type="text" value={inviteLink} readOnly />
      <button onClick={inviteLinkClickHandler}>Create Invite Link</button>
    </>
  );
}

```

Already completed the server-side rendering guide?

You'll need to make a small change to your structure because the invite handler can only run on the client.

**File name: app/components/Festival.tsx**

```tsx
"use client";
import {
  createInviteLink,
  useAcceptInvite,
  useAccount,
  useAgent,
  useCoState,
} from "jazz-tools/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Festival as FestivalSchema, JazzFestAccount } from "@/app/schema";

export function Festival({ id }: { id?: string }) {
  const [inviteLink, setInviteLink] = useState<string>("");
  // [!code ++:1]
  const agent = useAgent();
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: true } },
  });
  const router = useRouter();
  // [!code ++:2]
  const isGuest = agent.$type$ !== "Account";
  if (!isGuest) {
    useAcceptInvite({
      invitedObjectSchema: FestivalSchema,
      onAccept: (festivalID: string) => {
        router.push(`/festival/${festivalID}`);
      },
    });
    // [!code ++:1]
  }

  const festivalId =
    id ?? (me.$isLoaded ? me.root.myFestival.$jazz.id : undefined);
  const festival = useCoState(FestivalSchema, festivalId);
  if (!festival.$isLoaded) return null;
  const inviteLinkClickHandler = () => {
    const link = createInviteLink(festival, "writer");
    setInviteLink(link);
  };
  return (
    <>
      <ul>
        {festival.map(
          (band) => band.$isLoaded && <li key={band.$jazz.id}>{band.name}</li>,
        )}
      </ul>
      <input type="text" value={inviteLink} readOnly />
      <button type="button" onClick={inviteLinkClickHandler}>
        Create Invite Link
      </button>
    </>
  );
}

```

You'll also need to be aware that the server agent can only render public CoValues, and the schema above does not publicly share any data (neither bands nor festivals).

## Create the festival page

Now we need to create the festival page, so that we can view other people's festivals and collaborate with them.

### Update our Festival component

We're going to continue updating our existing `Festival` component so that it can optionally take a prop for the festival ID.

**File name: app/components/Festival.tsx**

```tsx
"use client";
import {
  createInviteLink,
  useAcceptInvite,
  useAccount,
  // [!code ++:1]
  useCoState,
} from "jazz-tools/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// We need to alias the schema because our component is also named Festival
import { Festival as FestivalSchema, JazzFestAccount } from "@/app/schema";

// [!code ++:1]
export function Festival({ id }: { id?: string }) {
  const [inviteLink, setInviteLink] = useState<string>("");
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: true } },
  });
  const router = useRouter();
  useAcceptInvite({
    invitedObjectSchema: FestivalSchema,
    onAccept: (festivalID: string) => {
      router.push(`/festival/${festivalID}`);
    },
  });
  // [!code ++:2]
  const festivalId =
    id ?? (me.$isLoaded ? me.root.myFestival.$jazz.id : undefined);
  const festival = useCoState(FestivalSchema, festivalId);
  // [!code --:1]
  if (!me.$isLoaded) return null;
  // [!code ++:1]
  if (!festival.$isLoaded) return null;
  const inviteLinkClickHandler = () => {
    // [!code --:1]
    const link = createInviteLink(me.root.myFestival, "writer");
    // [!code ++:1]
    const link = createInviteLink(festival, "writer");
    setInviteLink(link);
  };
  return (
    <>
      <ul>
        {/* [!code --:3] */}
        {me.root.myFestival.map((band) => {
          return band.$isLoaded && <li key={band.$jazz.id}>{band.name}</li>;
        })}
        {/* [!code ++:3] */}
        {festival.map(
          (band) => band.$isLoaded && <li key={band.$jazz.id}>{band.name}</li>,
        )}
      </ul>
      {me.canAdmin(festival) && (
        <>
          <input type="text" value={inviteLink} readOnly />
          <button type="button" onClick={inviteLinkClickHandler}>
            Create Invite Link
          </button>
        </>
      )}
    </>
  );
}

```

### Update our New Band component

We'll also update our `NewBand` component so that it can take a prop for the festival ID, which will make it reusable on our home page and the new festival page.

**File name: app/components/NewBand.tsx**

```tsx
"use client";
// [!code --:2]
import { useAccount } from "jazz-tools/react";
import { JazzFestAccount } from "@/app/schema";
// [!code ++:3]
import { useAccount, useCoState } from "jazz-tools/react";
import { useState } from "react";
import { JazzFestAccount, Festival } from "@/app/schema";

// [!code ++:1]
export function NewBand({ id }: { id?: string }) {
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: true } },
  });
  const [name, setName] = useState("");

  // [!code ++:2]
  const festivalId =
    id ??
    (me.$isLoaded && me.root.$isLoaded
      ? me.root.myFestival.$jazz.id
      : undefined);
  const festival = useCoState(Festival, festivalId);

  const handleSave = () => {
    // [!code --:2]
    if (!me.$isLoaded) return;
    me.root.myFestival.$jazz.push({ name });
    // [!code ++:2]
    if (!festival.$isLoaded) return;
    festival.$jazz.push({ name });
    setName("");
  };

  return (
    <div>
      <input
        type="text"
        value={name}
        placeholder="Band name"
        onChange={(e) => setName(e.target.value)}
      />
      <button type="button" onClick={handleSave}>
        Add
      </button>
    </div>
  );
}

```

### Create a route

**File name: app/festival/\[festivalId\]/page.tsx**

```tsx
"use client";
import { use } from "react";
import { Festival } from "$lib/Festival";
import { NewBand } from "@/app/components/NewBand";

export default function FestivalPage(props: {
  params: Promise<{ festivalId: string }>;
}) {
  const { festivalId } = use(props.params);

  return (
    <main>
      <h1>🎪 Festival {festivalId}</h1>
      <Festival id={festivalId} />
      <NewBand id={festivalId} />
    </main>
  );
}

```

## Put it all together

Now we can test it out by inviting someone to collaborate on our festival.

1. Open your app and sign in.
2. Open a new incognito window and sign up with a new passkey.
3. From your first browser tab, create an invite link for the festival.
4. You should be able to invite someone to collaborate on the festival.
5. Paste the invite link into the incognito window. You should be able to add bands to the festival!

**Congratulations! 🎉** You've added public sharing to your app! You've learned what groups are, and how Jazz manages permissions, as well as how to invite others to collaborate on data in your app with you.

## Next steps

* Learn how to [authenticate users](/docs/key-features/authentication/quickstart) so you can access data wherever you are.
* Discover how you can use [groups as members of other groups](/docs/permissions-and-sharing/cascading-permissions) to build advanced permissions structures.
* Find out how to [use server workers](/docs/server-side/quickstart) to build more complex applications


### Sharing
# Public sharing and invites

## Public sharing

You can share CoValues publicly by setting the `owner` to a `Group`, and granting access to "everyone".

```ts
const group = Group.create();
group.addMember("everyone", "writer");

```

You can also use `makePublic(role)` alias to grant access to everyone with a specific role (defaults to `reader`).

```ts
const group = Group.create();
  group.addMember("everyone", "writer"); // [!code --]
  group.makePublic("writer"); // [!code ++]
  // group.makePublic(); // Defaults to "reader" access

```

This is done in the [chat example](https://github.com/garden-co/jazz/tree/main/examples/chat) where anyone can join the chat, and send messages.

You can also [add members by Account ID](/docs/permissions-and-sharing/overview#adding-group-members-by-id).

## Invites

You can grant users access to a CoValue by sending them an invite link.

This is used in the [todo example](https://github.com/garden-co/jazz/tree/main/examples/todo).

```tsx
import { createInviteLink } from "jazz-tools/react";

const inviteLink = createInviteLink(organization, "writer"); // or reader, admin, writeOnly

```

It generates a URL that looks like `.../invite/[CoValue ID]/[inviteSecret]`

In your app, you need to handle this route, and let the user accept the invitation, as done [here](https://github.com/garden-co/jazz/tree/main/examples/todo/src/2%5Fmain.tsx).

```tsx
import { useAcceptInvite } from "jazz-tools/react";

useAcceptInvite({
  invitedObjectSchema: Organization,
  onAccept: async (organizationID) => {
    const organization = await Organization.load(organizationID);
    if (!organization.$isLoaded)
      throw new Error("Organization could not be loaded");
    me.root.organizations.$jazz.push(organization);
    // navigate to the organization page
  },
});

```

You can accept an invitation programmatically by using the `acceptInvite` method on an account.

Pass the ID of the CoValue you're being invited to, the secret from the invite link, and the schema of the CoValue.

```ts
await account.acceptInvite(organizationId, inviteSecret, Organization);

```

### Invite Secrets

The invite links generated by Jazz are convenient ways of handling invites.

In case you would prefer more direct control over the invite, you can create an invite to a `Group` using `Group.createInvite(id, role)` or `group.$jazz.createInvite(role)`.

This will generate a string starting with `inviteSecret_`. You can then accept this invite using `acceptInvite`, with the group ID as the first argument, and the invite secret as the second.

```ts
const groupToInviteTo = Group.create();
const readerInvite = groupToInviteTo.$jazz.createInvite("reader");
// `inviteSecret_`

await account.acceptInvite(group.$jazz.id, readerInvite);

```

**Warning: Security Note** 

**Invites do not expire and cannot be revoked.** If you choose to generate your own secrets in this way, take care that they are not shared in plain text over an insecure channel.

One particularly tempting mistake is passing the secret as a route parameter or a query. However, this will cause your secret to appear in server logs. You should only ever use fragment identifiers (i.e. parts after the hash in the URL) to share secrets, as these are not sent to the server (see the `createInviteLink` implementation).

### Requesting Invites

To allow a non-group member to request an invitation to a group you can use the `writeOnly` role. This means that users only have write access to a specific requests list (they can't read other requests). However, Administrators can review and approve these requests.

Create the data models.

```ts
const JoinRequest = co.map({
  account: co.account(),
  status: z.literal(["pending", "approved", "rejected"]),
});

const RequestsList = co.list(JoinRequest);

```

Set up the request system with appropriate access controls.

```ts
function createRequestsToJoin() {
  const requestsGroup = Group.create();
  requestsGroup.addMember("everyone", "writeOnly");

  return RequestsList.create([], requestsGroup);
}

async function sendJoinRequest(
  requestsList: co.loaded<typeof RequestsList>,
  account: Account,
) {
  const request = JoinRequest.create(
    {
      account,
      status: "pending",
    },
    requestsList.$jazz.owner, // Inherit the access controls of the requestsList
  );

  requestsList.$jazz.push(request);

  return request;
}

```

Using the write-only access users can submit requests that only administrators can review and approve.

```ts
async function approveJoinRequest(
  joinRequest: co.loaded<typeof JoinRequest, { account: true }>,
  targetGroup: Group,
) {
  const account = await co.account().load(joinRequest.$jazz.refs.account.id);

  if (account.$isLoaded) {
    targetGroup.addMember(account, "reader");
    joinRequest.$jazz.set("status", "approved");

    return true;
  } else {
    return false;
  }
}

```


### Cascading Permissions
# Groups as members

Groups can be added to other groups using the `addMember` method.

When a group is added as a member of another group, members of the added group will become part of the containing group.

## Basic usage

Here's how to add a group as a member of another group:

```ts
const playlistGroup = Group.create();
const trackGroup = Group.create();

// Tracks are now visible to the members of playlist
trackGroup.addMember(playlistGroup);

```

When you add groups as members:

* Members of the added group become members of the container group
* Their roles are inherited (with some exceptions, see [below](#the-rules-of-role-inheritance))
* Revoking access from the member group also removes its access to the container group

## Levels of inheritance

Adding a group as a member of another is not limited in depth:

```ts
const grandParentGroup = Group.create();
const parentGroup = Group.create();
const childGroup = Group.create();

childGroup.addMember(parentGroup);
parentGroup.addMember(grandParentGroup);

```

Members of the grandparent group will get access to all descendant groups based on their roles.

## Roles

### The rules of role inheritance

If the account is already a member of the container group, it will get the more permissive role:

```ts
const addedGroup = Group.create();
addedGroup.addMember(bob, "reader");

const containingGroup = Group.create();
addedGroup.addMember(bob, "writer");
containingGroup.addMember(addedGroup);

// Bob stays a writer because his role is higher
// than the inherited reader role.

```

When adding a group to another group, only admin, writer and reader roles are inherited:

```ts
const addedGroup = Group.create();
  containingGroup.addMember(bob, "writeOnly");

  const mainGroup = Group.create();
  mainGroup.addMember(containingGroup);

```

### Overriding the added group's roles

In some cases you might want to inherit all members from an added group but override their roles to the same specific role in the containing group. You can do so by passing an "override role" as a second argument to `addMember`:

```ts
const organizationGroup = Group.create();
organizationGroup.addMember(bob, "admin");

const billingGroup = Group.create();

// This way the members of the organization
// can only read the billing data
billingGroup.addMember(organizationGroup, "reader");
```ts index.ts#OverrideContainers

```

### Permission changes

When you remove a member from an added group, they automatically lose access to all containing groups. We handle key rotation automatically to ensure security.

```ts
// Remove member from added group
addedGroup.removeMember(bob);

// Bob loses access to both groups.
// If Bob was also a member of the containing group,
// he wouldn't have lost access.

```

## Removing groups from other groups

You can remove a group from another group by using the `removeMember` method:

```ts
const addedGroup = Group.create();
  const containingGroup = Group.create();

  containingGroup.addMember(addedGroup);

  // Revoke the extension
  containingGroup.removeMember(addedGroup);

```

## Getting all added groups

You can get all of the groups added to a group by calling the `getParentGroups` method:

```ts
const containingGroup = Group.create();
  const addedGroup = Group.create();
  containingGroup.addMember(addedGroup);

  console.log(containingGroup.getParentGroups()); // [addedGroup]

```

## Ownership on implicit CoValue creation

When creating CoValues that contain other CoValues (or updating references to CoValues) using plain JSON objects, Jazz not only creates the necessary CoValues automatically but it will also manage their group ownership.

```ts
const Task = co.plainText();
const Column = co.list(Task);
const Board = co.map({
  title: z.string(),
  columns: co.list(Column),
});

const board = Board.create({
  title: "My board",
  columns: [
    ["Task 1.1", "Task 1.2"],
    ["Task 2.1", "Task 2.2"],
  ],
});

```

For each created column and task CoValue, Jazz also creates a new group as its owner and adds the referencing CoValue's owner as a member of that group. This means permissions for nested CoValues are inherited from the CoValue that references them, but can also be modified independently for each CoValue if needed.

```ts
const writeAccess = Group.create();
writeAccess.addMember(bob, "writer");

// Give Bob write access to the board, columns and tasks
const boardWithGranularPermissions = Board.create(
  {
    title: "My board",
    columns: [
      ["Task 1.1", "Task 1.2"],
      ["Task 2.1", "Task 2.2"],
    ],
  },
  writeAccess,
);

// Give Alice read access to one specific task
const task = boardWithGranularPermissions.columns[0][0];
const taskGroup = task.$jazz.owner;
taskGroup.addMember(alice, "reader");

```

If you prefer to manage permissions differently, you can always create CoValues explicitly:

```ts
const writeAccess = Group.create();
writeAccess.addMember(bob, "writer");
const readAccess = Group.create();
readAccess.addMember(bob, "reader");

// Give Bob read access to the board and write access to the columns and tasks
const boardWithExplicitPermissions = Board.create(
  {
    title: "My board",
    columns: co.list(Column).create(
      [
        ["Task 1.1", "Task 1.2"],
        ["Task 2.1", "Task 2.2"],
      ],
      writeAccess,
    ),
  },
  readAccess,
);

```

## Example: Team Hierarchy

Here's a practical example of using group inheritance for team permissions:

```ts
// Company-wide group
const companyGroup = Group.create();
companyGroup.addMember(CEO, "admin");

// Team group with elevated permissions
const teamGroup = Group.create();
teamGroup.addMember(companyGroup); // Inherits company-wide access
teamGroup.addMember(teamLead, "admin");
teamGroup.addMember(developer, "writer");

// Project group with specific permissions
const projectGroup = Group.create();
projectGroup.addMember(teamGroup); // Inherits team permissions
projectGroup.addMember(client, "reader"); // Client can only read project items

```

This creates a hierarchy where:

* The CEO has admin access to everything
* Team members get writer access to team and project content
* Team leads get admin access to team and project content
* The client can only read project content


### Version control
# Version Control

Jazz provides built-in version control through branching and merging, allowing multiple users to work on the same resource in isolation and merge their changes when they are ready.

This enables the design of new editing workflows where users (or agents!) can create branches, make changes, and merge them back to the main version.

**Info:** 

**Important:** Version control is currently unstable and we may ship breaking changes in patch releases.

## Working with branches

### Creating Branches

To create a branch, use the `unstable_branch` option when loading a CoValue:

```ts
const branch = await Project.load(projectId, {
  unstable_branch: { name: "feature-branch" },
});

```

You can also create a branch via the `useCoState` hook:

```ts
const branch = useCoState(Project, projectId, {
  unstable_branch: { name: "feature-branch" },
});

```

You can also include nested CoValues in your branch by using a [resolve query](/docs/core-concepts/subscription-and-loading#resolve-queries).

You are in control of how nested CoValues are included in your branch. When you specify the CoValue to branch, any nested CoValues specified in a `resolve` query will also be branched. Nested CoValues _not_ specified in your resolve query will not be branched.

In order to access branched nested CoValues, you should access them in the same way you would normally access a deeply loaded property, and all operations will work within the branch context.

**Info:** 

In case you create a separate reference to a nested CoValue (for example by loading it by its ID), or you use `.$jazz.ensureLoaded()` or `.$jazz.subscribe()`, you will need to specify the branch you wish to load.

### Making Changes

Once you have a branch, you can make changes just as you would with the original CoValue:

```tsx
function EditProject({
  projectId,
  currentBranchName,
}: {
  projectId: ID<typeof Project>;
  currentBranchName: string;
}) {
  const project = useCoState(Project, projectId, {
    resolve: {
      tasks: { $each: true },
    },
    unstable_branch: {
      name: currentBranchName,
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Won't be visible on main until merged
    project.$isLoaded && project.$jazz.set("title", e.target.value);
  };

  const handleTaskTitleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const task = project.$isLoaded && project.tasks[index];

    // The task is also part of the branch because we used the `resolve` option
    // with `tasks: { $each: true }`
    // so the changes won't be visible on main until merged
    task && task.$jazz.set("title", e.target.value);
  };

  return <form onSubmit={handleSave}>{/* Edit form fields */}</form>;
}

```

### Account & Group

Branching does not bring isolation on Account and Group CoValues.

This means that, adding a member on a branched Group will also add the member to the main Group.

```ts
const featureBranch = await Project.load(projectId, {
  unstable_branch: { name: "feature-branch" },
});
featureBranch.$isLoaded &&
  featureBranch.$jazz.owner.addMember(member, "writer"); // Will also add the member to the main Group

```

If you are modifying an account, be aware that replacing the root or profile will also modify the main account (although updating the properties will happen on the branch).

```tsx
const me = useAccount(MyAccount, {
  resolve: { root: true },
  unstable_branch: { name: "feature-branch" },
});

me.$isLoaded && me.$jazz.set("root", { value: "Feature Branch" }); // Will also modify the main account
me.$isLoaded && me.root.$jazz.set("value", "Feature Branch"); // This only modifies the branch

```

### Merging Branches

There are two ways to merge a branch in Jazz, each with different characteristics:

#### 1\. Merge loaded values

This method merges all the values that are currently loaded inside the branch. It happens synchronously and there is no possibility of errors because the values are already loaded.

```ts
async function handleSave() {
  // Merge all currently loaded values in the branch
  branch.$isLoaded && branch.$jazz.unstable_merge();
}

```

This approach is recommended when you can co-locate the merge operation with the branch load, keeping at a glance what the merge operation will affect.

**Info:** 

**Important:** The merge operation will only affect values loaded in the current subscription scope. Values loaded via `ensureLoaded` or `subscribe` will not be affected.

#### 2\. Merge with resolve query

This is a shortcut for loading a value and calling `branch.$jazz.unstable_merge()` on it and will fail if the load isn't possible due to permission errors or network issues.

```ts
async function handleSaveWithResolve() {
  // Merge the branch changes back to main
  await Project.unstable_merge(projectId, {
    resolve: {
      tasks: { $each: true },
    },
    branch: { name: "feature-branch" },
  });
}

```

This approach is recommended for more complex merge operations where it's not possible to co-locate the merge with the branch load.

#### Best Practices

When using version control with Jazz, always be exhaustive when defining the resolve query to keep the depth of the branch under control and ensure that the merge covers all the branched values.

The mechanism that Jazz uses to automatically load accessed values should be avoided with branching, as it might lead to cases where merge won't reach all the branch changes.

All the changes made to the branch will be merged into the main CoValue, preserving both author and timestamp.

The merge is idempotent, so you can merge the same branch multiple times, the result will always depend on the branch changes and loading state.

The merge operation cascades down to the CoValue's children, but not to its parents. So if you call `unstable_merge()` on a task, only the changes to the task and their children will be merged:

```tsx
async function handleTaskSave(index: number) {
  const task = project.tasks[index];
  // Only the changes to the task will be merged
  task.$jazz.unstable_merge();
}

```

## Conflict Resolution

When conflicts occur (the same field is modified in both the branch and main), Jazz uses a "last writer wins" strategy:

```ts
// Branch modifies priority to "high"
branch.$isLoaded && branch.$jazz.applyDiff({ priority: "high" });

// Meanwhile, main modifies priority to "urgent"
originalProject.$isLoaded &&
  originalProject.$jazz.applyDiff({ priority: "urgent" });

// Merge the branch
branch.$isLoaded && branch.$jazz.unstable_merge();

// Main's value ("urgent") wins because it was written later
console.log(originalProject.priority); // "urgent"

```

## Private branches

When the owner is not specified, the branch has the same permissions as the main values.

You can also create a private branch by providing a group owner.

```ts
// Create a private group for the branch
const privateGroup = Group.create();

const privateBranch = Project.load(projectId, {
  unstable_branch: {
    name: "private-edit",
    owner: privateGroup,
  },
});

// Only members of privateGroup can see the branch content
// The sync server cannot read the branch content

```

You can use private branches both to make the changes to the branches "private" until merged, or to give controlled write access to a group of users.

Only users with both write access to the main branch and read access to the private branch have the rights to merge the branch.

**Info:** 

**Important:** Branch names are scoped to their owner. The same branch name with different owners creates completely separate branches. For example, a branch named "feature-branch" owned by User A is completely different from a branch named "feature-branch" owned by User B.

## Branch Identification

You can get the current branch information from the `$jazz` field.

```ts
const myBranch = await Project.load(projectId, {
  unstable_branch: { name: "feature-branch" },
});

console.log(myBranch.$jazz.id); // Branch ID is the same as source
console.log(myBranch.$isLoaded && myBranch.$jazz.branchName); // "feature-branch"
console.log(myBranch.$isLoaded && myBranch.$jazz.isBranched); // true

```


### History
# History

Jazz tracks every change to your data automatically. See who changed what, when they did it, and even look at your data from any point in the past.

See the [version history example](https://github.com/garden-co/jazz/tree/main/examples/version-history) for reference.

Let's use the following schema to see how we can use the edit history.

```ts
export const Task = co.map({
  title: z.string(),
  status: z.literal(["todo", "in-progress", "completed"]),
});
export type Task = co.loaded<typeof Task>;

```

## The $jazz.getEdits() method

Every CoValue has a `$jazz.getEdits()` method that contains the complete history for each field. Here's how to get the edit history for `task.status`:

```ts
task.$jazz.getEdits().status;
// Returns the latest edit

task.$jazz.getEdits().status?.all;
// Returns array of all edits in chronological order

// Check if edits exist
const statusEdits = task.$jazz.getEdits().status;
if (statusEdits && statusEdits.by?.profile.$isLoaded) {
  const name = statusEdits.by.profile.name;
  console.log(`Last changed by ${name}`);
}

```

## Edit Structure

Each edit contains:

```ts
const edit = task.$jazz.getEdits().status;

// The edit object contains:
edit?.value; // The new value: "in-progress"
edit?.by; // Account that made the change
edit?.madeAt; // Date when the change occurred

```

## Accessing History

### Latest Edit

Get the most recent change to a field:

```ts
// Direct access to latest edit
const latest = task.$jazz.getEdits().title;
if (latest) {
  console.log(`Title is now "${latest.value}"`);
}

```

### All Edits

Get the complete history for a field:

```ts
// Get all edits (chronologically)
const allStatusEdits = task.$jazz.getEdits().status?.all || [];

allStatusEdits.forEach((edit, index) => {
  console.log(`Edit ${index}: ${edit.value} at ${edit.madeAt.toISOString()}`);
});
// Edit 0: todo at 2025-05-22T13:00:00.000Z
// Edit 1: in-progress at 2025-05-22T14:00:00.000Z
// Edit 2: completed at 2025-05-22T15:30:00.000Z

```

### Initial Values

The first edit contains the initial value:

```ts
const allEdits = task.$jazz.getEdits().status?.all || [];
const initialValue = allEdits[0]?.value;
console.log(`Started as: ${initialValue}`);
// Started as: todo

```

### Created Date and Last Updated Date

To show created date and last updated date, use the `$jazz.createdAt` and `$jazz.lastUpdatedAt` getters.

```tsx
console.log(new Date(task.$jazz.createdAt));
console.log(new Date(task.$jazz.lastUpdatedAt));

```

## Requirements

* CoValues must be loaded to access history (see [Subscription & Loading](/docs/core-concepts/subscription-and-loading))
* History is only available for fields defined in your schema
* Edit arrays are ordered chronologically (oldest to newest)

## Common Patterns

For practical implementations using history, see [History Patterns](/docs/reference/design-patterns/history-patterns):

* Building audit logs
* Creating activity feeds
* Implementing undo/redo
* Showing change indicators
* Querying historical data


## Server-Side Development

### Quickstart
# Get started with Server Workers in 10 minutes

This quickstart guide will take you from an empty project to a server worker which can interact with your Jazz application.

* You'll get the most out of this guide if you complete [the frontend quickstart guide](/docs/quickstart) first.
* If you've already completed the frontend quickstart, you can skip straight to [extending your schema](#define-your-schema).

## Create your Next.js App

We'll be using Next.js for simplicity, but you can use any framework you like.

You can accept the defaults for all the questions, or customise the project as you like.

```sh
npx create-next-app@latest --typescript jazzfest
cd jazzfest

```

**Info:** 

Requires Node.js 20+

## Install Jazz

The `jazz-tools` package includes everything you're going to need to build your first Jazz server worker.

```sh
npm install jazz-tools

```

## Set your API key

Sign up for a free API key at [dashboard.jazz.tools](https://dashboard.jazz.tools) for higher limits or production use, or use your email address as a temporary key to get started quickly.

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY="you@example.com" # or your API key

```

## Define your schema

We're going to define a simple schema for our server worker. We'll use the `root` on the worker to store a list of bands. We're also going to add a migration to initialise the `root` if it doesn't exist.

**File name: app/schema.ts**

```ts
import { co, z } from "jazz-tools";

export const Band = co.map({
  name: z.string(),
});

export const BandList = co.list(Band);

export const JazzFestWorkerAccount = co
  .account({
    root: co.map({
      bandList: BandList,
    }),
    profile: co.profile(),
  })
  .withMigration(async (account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        bandList: [],
      });
      if (account.root.$isLoaded) {
        account.root.$jazz.owner.makePublic();
      }
    }
  });

```

**Info:** 

If you're continuing from the [front-end Quickstart](/docs/quickstart), you can extend your existing schema.

## Create a Server Worker

Jazz provides a CLI to create server workers. You can create a server worker using the following command:

```sh
npx jazz-run account create --name "JazzFest Server Worker"

```

You can copy the output of this command and paste it directly into your `.env` file:

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY=you@example.com # or your API key
#[!code ++:2]
NEXT_PUBLIC_JAZZ_WORKER_ACCOUNT=co_z...
JAZZ_WORKER_SECRET=sealerSecret_z.../signerSecret_z...

```

**Warning:** 

Your `JAZZ_WORKER_SECRET` should **never** be exposed to the client.

## Defining your HTTP request schema

Next, we're going to set up an HTTP request schema to define our request and response. Here, we tell Jazz that we will send a `Band` under the key `band` and expect a `bandList` in response, which is a list of `Band`s.

We also need to tell Jazz which keys should be treated as loaded in the request and response using the `resolve` query.

**File name: app/announceBandSchema.ts**

```ts
import { experimental_defineRequest } from "jazz-tools";
import { Band, BandList } from "./schema";

const workerId = process.env.NEXT_PUBLIC_JAZZ_WORKER_ACCOUNT;

if (!workerId) throw new Error("NEXT_PUBLIC_JAZZ_WORKER_ACCOUNT is not set");

export const announceBand = experimental_defineRequest({
  url: "/api/announce-band",
  workerId: workerId,
  request: { schema: { band: Band }, resolve: { band: true } },
  response: {
    schema: { bandList: BandList },
    resolve: { bandList: { $each: true } },
  },
});

```

## Configure your Server Worker

We're going to use the `startWorker` function to start our server worker, and register a `POST` handler, which will listen for the requests being sent to our server worker.

We'll also use a `resolve` query here to make sure that the `bandList` is loaded on the worker's root.

**File name: app/api/announce-band/route.ts**

```ts
import { startWorker } from "jazz-tools/worker";
import { announceBand } from "@/app/announceBandSchema";
import { JazzFestWorkerAccount } from "./schema";

const { worker } = await startWorker({
  syncServer: `wss://cloud.jazz.tools/?key=${process.env.NEXT_PUBLIC_JAZZ_API_KEY}`,
  accountID: process.env.NEXT_PUBLIC_JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
  AccountSchema: JazzFestWorkerAccount,
});

export async function POST(request: Request) {
  return announceBand.handle(request, worker, async ({ band }) => {
    if (!band) {
      throw new Error("Band is required");
    }
    const {
      root: { bandList },
    } = await worker.$jazz.ensureLoaded({
      resolve: {
        root: {
          bandList: true,
        },
      },
    });
    bandList.$jazz.push(band);
    return { bandList };
  });
}

```

## Start your server worker

We can now start our development server to make sure everything is working.

```bash
npm run dev

```

If you open your browser, you should see the default Next.js welcome page.

### Not working?

* Check you set up your `.env` file correctly with `NEXT_PUBLIC_` where necessary
* Check you're importing `startWorker` from `jazz-tools/worker`

**Info: Still stuck?** Ask for help on [Discord](https://discord.gg/utDMjHYg42)!

## Send requests to your server worker

### Creating a Jazz Client

_If you already have a working provider from the frontend quickstart, you can skip this step._

We're going to wrap our Next.js app in a `JazzReactProvider` so that we can use Jazz on our client.

**File name: app/layout.tsx**

```tsx
import { JazzReactProvider } from "jazz-tools/react";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
  <html lang="en">
    <body>
      <JazzReactProvider
        sync={{ peer: `wss://cloud.jazz.tools/?key=${apiKey}` }}
      >
        {children}
      </JazzReactProvider>
    </body>
  </html>
);
}

```

### Creating your page component

We're going to send a request to our server worker to announce a new band. Our worker will respond with a list of bands that we can display on our page.

**File name: app/page.tsx**

```tsx
"use client";
import type { co } from "jazz-tools";
import { useState } from "react";
import { announceBand } from "@/app/announceBandSchema";
import type { BandList } from "./schema";

export default function Home() {
  const [bandName, setBandName] = useState("");
  const [bandList, setBandList] =
    useState<co.loaded<typeof BandList, { $each: true }>>();
  const handleAnnounceBand = async () => {
    const bandListResponse = await announceBand.send({
      band: { name: bandName },
    });
    setBandName("");
    if (bandListResponse.bandList.$isLoaded) {
      setBandList(bandListResponse.bandList);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={bandName}
        onChange={(e) => setBandName(e.target.value)}
      />
      <button type="button" onClick={handleAnnounceBand}>
        Announce Band
      </button>
      <div>
        {bandList?.$isLoaded &&
          bandList.map(
            (band) => band && <div key={band?.$jazz.id}>{band.name}</div>,
          )}
      </div>
    </div>
  );
}

```

## Try it out!

Your browser should now be showing you a page with an input field and a button. If you enter a band name and click the button, your server worker will receive the request and add the band to the list.

**Congratulations! 🎉** You've just built your first Jazz server worker!

This simple pattern is the foundation for building powerful, real-time applications.

Here are some ideas about what you could use your server worker for:

* integrating with payment providers
* sending emails/SMSes
* gathering data from external APIs
* managing authoritative state

Looking forward to seeing what you build!

## Next steps

* Complete the [front-end quickstart](/docs/quickstart) to learn more about how to build real-time UIs using Jazz
* Find out how to [handle errors](/docs/server-side/communicating-with-workers/http-requests#error-handling) gracefully in your server worker
* Learn how to share and [collaborate on data](/docs/permissions-and-sharing/overview) in groups with complex permissions


### Setup
# Running Jazz on the server

Jazz is a distributed database that can be used on both clients or servers without any distinction.

You can use servers to:

* perform operations that can't be done on the client (e.g. sending emails, making HTTP requests, etc.)
* validate actions that require a central authority (e.g. a payment gateway, booking a hotel, etc.)

We call the code that runs on the server a "Server Worker".

The main difference to keep in mind when working with Jazz compared to traditional systems is that server code doesn't have any special or privileged access to the user data. You need to be explicit about what you want to share with the server.

This means that your server workers will have their own accounts, and they need to be explicitly given access to the CoValues they need to work on.

## Generating credentials

Server Workers typically have static credentials, consisting of a public Account ID and a private Account Secret.

To generate new credentials for a Server Worker, you can run:

```sh
npx jazz-run account create --name "My Server Worker"

```

The name will be put in the public profile of the Server Worker's `Account`, which can be helpful when inspecting metadata of CoValue edits that the Server Worker has done.

**Info: Note** 

By default the account will be stored in Jazz Cloud. You can use the `--peer` flag to store the account on a different sync server.

## Running a server worker

You can use `startWorker` to run a Server Worker. Similarly to setting up a client-side Jazz context, it:

* takes a custom `AccountSchema` if you have one (for example, because the worker needs to store information in its private account root)
* takes a URL for a sync & storage server

The migration defined in the `AccountSchema` will be executed every time the worker starts, the same way as it would be for a client-side Jazz context.

```ts
import { startWorker } from "jazz-tools/worker";

const { worker } = await startWorker({
  AccountSchema: MyWorkerAccount,
  syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
});

```

`worker` is an instance of the `Account` schema provided, and acts like `me` (as returned by `useAccount` on the client).

It will implicitly become the current account, and you can avoid mentioning it in most cases.

For this reason we also recommend running a single worker instance per server, because it makes your code much more predictable.

In case you want to avoid setting the current account, you can pass `asActiveAccount: false` to `startWorker`.

## Storing & providing credentials

Server Worker credentials are typically stored and provided as environment variables.

**Take extra care with the Account Secret — handle it like any other secret environment variable such as a DB password.**

## Wasm on Edge runtimes

To maximize compatibility, Jazz falls back to a slower, JavaScript crypto implementation if the faster WASM implementation is not available.

On some edge platforms, such as Cloudflare Workers or Vercel Edge Functions, environment security restrictions may trigger this fallback unnecessarily.

You can ensure that Jazz uses the faster WASM implementation by importing the WASM loader before using Jazz. For example:

```ts
import "jazz-tools/load-edge-wasm";
// Other Jazz Imports

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Jazz application logic
    return new Response("Hello from Jazz on Cloudflare!");
  },
};

```

Currently, the Jazz Loader is tested on the following edge environments:

* Cloudflare Workers
* Vercel Functions

### Requirements

* Edge runtime environment that supports WebAssembly
* `jazz-tools/load-edge-wasm` must be imported before any Jazz import

## Node-API

Jazz uses a WASM-based crypto implementation that provides near-native performance while ensuring full compatibility across a wide variety of environments.

For even higher performance on Node.js or Deno, you can enable the native crypto (Node-API) implementation. Node-API is Node.js's native API for building modules in Native Code (Rust/C++) that interact directly with the underlying system, allowing for true native execution speed.

You can use it as follows:

```ts
import { startWorker } from "jazz-tools/worker";
import { NapiCrypto } from "jazz-tools/napi";

const { worker } = await startWorker({
  syncServer: `wss://cloud.jazz.tools/?key=${apiKey}`,
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
  crypto: await NapiCrypto.create(),
});

```

**Info: Note** 

The Node-API implementation is not available on all platforms. It is only available on Node.js 20.x and higher. The supported platforms are:

* macOS (x64, ARM64)
* Linux (x64, ARM64, ARM, musl)

It does not work in edge runtimes.

### On Next.js

In order to use Node-API with Next.js, you need to tell Next.js to bundle the native modules in your build.

You can do this by adding the required packages to the [serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) array in your `next.config.js`.

**Note**: if you're deploying to Vercel, be sure to use the `nodejs` runtime!

**File name: next.config.js**

```ts
module.exports = {
  serverExternalPackages: [
    "cojson-core-napi",
    "cojson-core-napi-linux-x64-gnu",
    "cojson-core-napi-linux-x64-musl",
    "cojson-core-napi-linux-arm64-gnu",
    "cojson-core-napi-linux-arm64-musl",
    "cojson-core-napi-darwin-x64",
    "cojson-core-napi-darwin-arm64",
    "cojson-core-napi-linux-arm-gnueabihf",
  ],
};

```


### Overview
# Communicating with Server Workers

Server Workers in Jazz can receive data from clients through two different APIs, each with their own characteristics and use cases. This guide covers the key properties of each approach to help you choose the right one for your application.

## Overview

Jazz provides three ways to communicate with Server Workers:

1. **JazzRPC** \- A simple, yet powerful RPC system that allows you to call functions on Server Workers from the client side.
2. **HTTP Requests** \- The easiest to work with and deploy, ideal for simple communication with workers.
3. **Inbox** \- Fully built using the Jazz data model with offline support

## JazzRPC (Recommended)

JazzRPC is the most straightforward way to communicate with Server Workers. It works well with any framework or runtime that supports standard Request and Response objects, can be scaled horizontally, and put clients and workers in direct communication.

### When to use JazzRPC

Use JazzRPC when you need immediate responses, are deploying to serverless environments, need horizontal scaling, or are working with standard web frameworks.

It's also a good solution when using full-stack frameworks like Next.js, where you can use the API routes to handle the server-side logic.

[Learn more about JazzRPC →](/docs/server-side/jazz-rpc)

## HTTP Requests

If all you need is basic authentication when communicating with a worker, you can use Regular HTTP requests. They are the easiest to work with and deploy, ideal for simple communication with workers.

HTTP requests are the easiest way to communicate with Server Workers. They don't come with any of the benefits of JazzRPC, but are a good solution for simple communication with workers.

### When to use HTTP Requests

Use HTTP requests when you don't need the advanced features of JazzRPC, but you need to communicate with a worker from a serverless environment or a standard web framework and need basic authentication.

[Learn more about HTTP Requests →](/docs/server-side/communicating-with-workers/http-requests)

## Inbox

The Inbox API is fully built using the Jazz data model and provides offline support. Requests and responses are synced as soon as the device becomes online, but require the Worker to always be online to work properly.

### When to use Inbox

Use Inbox when you need offline support, want to leverage the Jazz data model, can ensure the worker stays online, need persistent message storage, or want to review message history.

It works great when you don't want to expose your server with a public address, because it uses Jazz's sync to make the communication happen.

Since Jazz handles all the network communication, the entire class of network errors that usually come with traditional HTTP requests are not a problem when using the Inbox API.

[Learn more about Inbox →](/docs/server-side/communicating-with-workers/inbox)


### JazzRPC
# JazzRPC

JazzRPC is the most straightforward and complete way to securely communicate with Server Workers. It works well with any framework or runtime that supports standard Request and Response objects, can be scaled horizontally, and puts clients and workers in direct communication.

## Setting up JazzRPC

### Defining request schemas

Use `experimental_defineRequest` to define your API schema:

```ts
import { experimental_defineRequest, z } from "jazz-tools";
import { Event, Ticket } from "@/lib/schema";

const workerId = process.env.NEXT_PUBLIC_JAZZ_WORKER_ACCOUNT!;

export const bookEventTicket = experimental_defineRequest({
  url: "/api/book-event-ticket",
  // The id of the worker Account or Group
  workerId,
  // The schema definition of the data we send to the server
  request: {
    schema: {
      event: Event,
    },
    // The data that will be considered as "loaded" in the server input
    resolve: {
      event: { reservations: true },
    },
  },
  // The schema definition of the data we expect to receive from the server
  response: {
    schema: { ticket: Ticket },
    // The data that will be considered as "loaded" in the client response
    // It defines the content that the server directly sends to the client, without involving the sync server
    resolve: { ticket: true },
  },
});

```

### Setting up the Server Worker

We need to start a Server Worker instance that will be able to sync data with the sync server, and handle the requests.

```ts
import { startWorker } from "jazz-tools/worker";

export const jazzServer = await startWorker({
  syncServer: "wss://cloud.jazz.tools/?key=your-api-key",
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
});

```

## Handling JazzRPC requests on the server

### Creating API routes

Create API routes to handle the defined RPC requests. Here's an example using Next.js API routes:

```ts
import { jazzServer } from "@/jazzServer";
import { Ticket } from "@/lib/schema";
import { bookEventTicket } from "@/bookEventTicket";
import { Group, JazzRequestError } from "jazz-tools";

export async function POST(request: Request) {
  return bookEventTicket.handle(
    request,
    jazzServer.worker,
    async ({ event }, madeBy) => {
      const ticketGroup = Group.create(jazzServer.worker);
      const ticket = Ticket.create({
        account: madeBy,
        event,
      });

      // Give access to the ticket to the client
      ticketGroup.addMember(madeBy, "reader");

      event.reservations.$jazz.push(ticket);

      return {
        ticket,
      };
    },
  );
}

```

## Making requests from the client

### Using the defined API

Make requests from the client using the defined API:

```ts
import { bookEventTicket } from "@/bookEventTicket";
import { Event } from "@/lib/schema";
import { co, isJazzRequestError } from "jazz-tools";

export async function sendEventBookingRequest(event: co.loaded<typeof Event>) {
  const { ticket } = await bookEventTicket.send({ event });

  return ticket;
}

export async function sendEventBookingRequest(event: co.loaded<typeof Event>) {
  try {
    const { ticket } = await bookEventTicket.send({ event });

    return ticket;
  } catch (error) {
    // This works as a type guard, so you can easily get the error message and details
    if (isJazzRequestError(error)) {
      alert(error.message);
      return;
    }
  }
}

```

## Error handling

### Server-side error handling

Use `JazzRequestError` to return proper HTTP error responses:

```ts
export async function POST(request: Request) {
  return bookEventTicket.handle(
    request,
    jazzServer.worker,
    async ({ event }, madeBy) => {
      // Check if the event is full
      if (event.reservations.length >= event.capacity) {
        // The JazzRequestError is propagated to the client, use it for any validation errors
        throw new JazzRequestError("Event is full", 400);
      }

      const ticketGroup = Group.create(jazzServer.worker);
      const ticket = Ticket.create({
        account: madeBy,
        event,
      });

      // Give access to the ticket to the client
      ticketGroup.addMember(madeBy, "reader");

      event.reservations.$jazz.push(ticket);

      return {
        ticket,
      };
    },
  );
}

```

**Info: Note** 

To ensure that the limit is correctly enforced, the handler should be deployed in a single worker instance (e.g. a single Cloudflare DurableObject).

Details on how to deploy a single instance Worker are available in the [Deployments & Transactionality](#deployments--transactionality) section.

### Client-side error handling

Handle errors on the client side:

```ts
export async function sendEventBookingRequest(event: co.loaded<typeof Event>) {
  try {
    const { ticket } = await bookEventTicket.send({ event });

    return ticket;
  } catch (error) {
    // This works as a type guard, so you can easily get the error message and details
    if (isJazzRequestError(error)) {
      alert(error.message);
      return;
    }
  }
}

```

**Info: Note** 

The `experimental_defineRequest` API is still experimental and may change in future versions. For production applications, consider the stability implications.

## Security safeguards provided by JazzRPC

JazzRPC includes several built-in security measures to protect against common attacks:

### Cryptographic Authentication

* **Digital Signatures**: Each RPC is cryptographically signed using the sender's private key
* **Signature Verification**: The server verifies the signature using the sender's public key to ensure message authenticity and to identify the sender account
* **Tamper Protection**: Any modification to the request payload will invalidate the signature

### Replay Attack Prevention

* **Unique Message IDs**: Each RPC has a unique identifier (`co_z${string}`)
* **Duplicate Detection**: incoming messages ids are tracked to prevent replay attacks
* **Message Expiration**: RPCs expire after 60 seconds to provide additional protection

These safeguards ensure that JazzRPC requests are secure, authenticated, and protected against common attack vectors while maintaining the simplicity of standard HTTP communication.

## Deployments & Transactionality

### Single Instance Requirements

Some operations need to happen one at a time and in the same place, otherwise the data can get out of sync.

For example, if you are checking capacity for an event and creating tickets, you must ensure only one server is doing it. If multiple servers check at the same time, they might all think there is space and allow too many tickets.

Jazz uses eventual consistency (data takes a moment to sync between regions), so this problem is worse if you run multiple server copies in different locations.

Until Jazz supports transactions across regions, the solution is to deploy a single server instance for these sensitive operations.

Examples of when you must deploy on a single instance are:

1. Distribute a limited number of tickets  
   * Limiting ticket sales so that only 100 tickets are sold for an event.  
   * The check (“is there space left?”) and ticket creation must happen together, or you risk overselling.
2. Inventory stock deduction  
   * Managing a product stock count (e.g., 5 items left in store).  
   * Multiple instances could let multiple buyers purchase the last item at the same time.
3. Sequential ID or token generation  
   * Generating unique incremental order numbers (e.g., #1001, #1002).  
   * Multiple instances could produce duplicates if not coordinated.

Single servers are necessary to enforce invariants or provide a consistent view of the data.

As a rule of thumb, when the output of the request depends on the state of the database, you should probably deploy on a single instance.

### Multi-Region Deployment

If your code doesn’t need strict rules to keep data in sync (no counters, no limits, no “check‑then‑update” logic), you can run your workers in many regions at the same time.

This way:

* Users connect to the closest server (faster).
* If one region goes down, others keep running (more reliable).

Examples of when it's acceptable to deploy across multiple regions are:

1. Sending confirmation emails  
   * After an action is complete, sending an email to the user does not depend on current database state.
2. Pushing notifications  
   * Broadcasting “event booked” notifications to multiple users can be done from any region.
3. Logging or analytics events  
   * Recording “user clicked this button” or “page viewed” events, since these are additive and don’t require strict ordering.
4. Calling external APIs (e.g., LLMs, payment confirmations)  
   * If the response does not modify shared counters or limits, it can be done from any region.
5. Pre-computing cached data or summaries  
   * Generating read-only previews or cached summaries where stale data is acceptable and does not affect core logic.

Generally speaking, if the output of the request does not depend on the state of the database, you can deploy across multiple regions.


### HTTP requests
# HTTP Requests with Server Workers

HTTP requests are the simplest way to communicate with Server Workers. While they don't provide all the features of [JazzRPC](/docs/server-side/jazz-rpc), they are a good solution when all you need is basic authentication.

They work by generating a short-lived token with `generateAuthToken` and attaching it to the request headers as `Authorization: Jazz <token>`. The server can then verify the token with `authenticateRequest` and get the account that the request was made by.

**Info: Note** 

While the token is cryptographically secure, using non secure connections still makes you vulnerable to MITM attacks as - unlike JazzRPC - the request is not signed.

Replay attacks are mitigated by token expiration (default to 1 minute), but it's up to you to ensure that the token is not reused.

It is recommended to use HTTPS whenever possible.

## Creating a Request

You can use any method to create a request; the most common is the `fetch` API.

By default, the token is expected to be in the `Authorization` header in the form of `Jazz <token>`.

```ts
import { generateAuthToken } from "jazz-tools";

const response = await fetch("https://example.com", {
  headers: {
    Authorization: `Jazz ${generateAuthToken()}`,
  },
});

```

## Authenticating requests

You can use the `authenticateRequest` function to authenticate requests.

Attempting to authenticate a request without a token doesn't fail; it returns `account` as `undefined`. For endpoints that **require** authentication, ensure `account` is defined in addition to any permission checks you may need.

```ts
import { authenticateRequest } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";

export async function GET(request: Request) {
  const worker = await startWorker({
    syncServer: "wss://cloud.jazz.tools/?key=your-api-key",
    accountID: process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret: process.env.JAZZ_WORKER_SECRET,
    asActiveAccount: true,
  });

  const { account, error } = await authenticateRequest(request);

  // There was an error validating the token (e.g., invalid or expired)
  if (error) {
    return new Response(JSON.stringify(error), { status: 401 });
  }

  if (!account) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(
    JSON.stringify({
      message: `The request was made by ${account.$jazz.id}`,
    }),
  );
}

```

## Multi-account environments

If you are using multiple accounts in your environment - for instance if your server starts multiple workers - or in general if you need to send and authenticate requests as a specific account, you can specify which one to use when generating the token or when authenticating the request.

### Making a request as a specific account

`generateAuthToken` accepts an optional account parameter, so you can generate a token for a specific account.

```ts
const response = await fetch("https://example.com", {
  headers: {
    Authorization: `Jazz ${generateAuthToken(account)}`,
  },
});

```

### Authenticating a request as a specific account

Similarly, specify the account used to verify the token via the `loadAs` option:

```ts
import { authenticateRequest } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";

export async function GET(request: Request) {
  const { worker } = await startWorker({
    syncServer: "wss://cloud.jazz.tools/?key=your-api-key",
    accountID: process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret: process.env.JAZZ_WORKER_SECRET,
  });

  const { account, error } = await authenticateRequest(request, {
    loadAs: worker,
  });
}

```

## Custom token expiration

You can specify the expiration time of the token using the `expiration` option. The default expiration time is 1 minute.

```ts
import { authenticateRequest } from "jazz-tools";

export async function GET(request: Request) {
  const { account, error } = await authenticateRequest(request, {
    expiration: 1000 * 60 * 60 * 24, // 24 hours
  });
}

```

## Custom token location

While using the `Authorization` header using the `Jazz <token>` format is the most common way to send the token, you can provide the token in any other way you want.

For example, you can send the token in the `x-jazz-auth-token` header:

```ts
import { generateAuthToken } from "jazz-tools";

const response = await fetch("https://example.com", {
  headers: {
    "x-jazz-auth-token": generateAuthToken(),
  },
});

```

Then you can specify the location of the token using the `getToken` option:

```ts
import { authenticateRequest } from "jazz-tools";

export async function GET(request: Request) {
  const { account, error } = await authenticateRequest(request, {
    getToken: (request) => request.headers.get("x-jazz-auth-token"),
  });
}

```

## Manual token parsing

If you need to manually parse a token from a string, you can use the `parseAuthToken` function.

```ts
import { parseAuthToken, generateAuthToken } from "jazz-tools";

const myToken = generateAuthToken();

const { account, error } = await parseAuthToken(myToken);

```


### Inbox API
# Inbox API with Server Workers

The Inbox API provides a message-based communication system for Server Workers in Jazz.

It works on top of the Jazz APIs and uses sync to transfer messages between the client and the server.

## Setting up the Inbox API

### Define the inbox message schema

Define the inbox message schema in your schema file:

```ts
export const BookTicketMessage = co.map({
  type: z.literal("bookTicket"),
  event: Event,
});

```

Any kind of CoMap is valid as an inbox message.

### Setting up the Server Worker

Run a server worker and subscribe to the `inbox`:

```ts
import { Account, co, Group } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { BookTicketMessage, Ticket } from "@/lib/schema";

const {
  worker,
  experimental: { inbox },
} = await startWorker({
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
  syncServer: "wss://cloud.jazz.tools/?key=your-api-key",
});

inbox.subscribe(BookTicketMessage, async (message, senderID) => {
  const madeBy = await co.account().load(senderID, { loadAs: worker });

  const { event } = await message.$jazz.ensureLoaded({
    resolve: {
      event: {
        reservations: true,
      },
    },
  });

  const ticketGroup = Group.create(worker);
  const ticket = Ticket.create({
    account: madeBy,
    event,
  });

  if (madeBy.$isLoaded) {
    // Give access to the ticket to the client
    ticketGroup.addMember(madeBy, "reader");
    event.reservations.$jazz.push(ticket);
  }

  return ticket;
});

```

### Handling multiple message types

`inbox.subscribe` should be called once per worker instance.

If you need to handle multiple message types, you can use the `co.discriminatedUnion` function to create a union of the message types.

```ts
const CancelReservationMessage = co.map({
  type: z.literal("cancelReservation"),
  event: Event,
  ticket: Ticket,
});

export const InboxMessage = co.discriminatedUnion("type", [
  BookTicketMessage,
  CancelReservationMessage,
]);

```

And check the message type in the handler:

```ts
import { InboxMessage } from "@/lib/schema";

inbox.subscribe(InboxMessage, async (message, senderID) => {
  switch (message.type) {
    case "bookTicket":
      return await handleBookTicket(message, senderID);
    case "cancelReservation":
      return await handleCancelReservation(message, senderID);
  }
});

```

## Sending messages from the client

### Using the Inbox Sender hook

Use `experimental_useInboxSender` to send messages from React components:

```ts
import { co } from "jazz-tools";
import { experimental_useInboxSender } from "jazz-tools/react";
import { BookTicketMessage, Event } from "@/lib/schema";

function EventComponent({ event }: { event: co.loaded<typeof Event> }) {
  const sendInboxMessage = experimental_useInboxSender(process.env.WORKER_ID);
  const [isLoading, setIsLoading] = useState(false);

  const onBookTicketClick = async () => {
    setIsLoading(true);

    const ticketId = await sendInboxMessage(
      BookTicketMessage.create({
        type: "bookTicket",
        event: event,
      }),
    );

    alert(`Ticket booked: ${ticketId}`);
    setIsLoading(false);
  };

  return (
    <button onClick={onBookTicketClick} disabled={isLoading}>
      Book Ticket
    </button>
  );
}

```

The `sendInboxMessage` API returns a Promise that waits for the message to be handled by a Worker. A message is considered to be handled when the Promise returned by `inbox.subscribe` resolves. The value returned will be the id of the CoValue returned in the `inbox.subscribe` resolved promise.

## Deployment considerations

Multi-region deployments are not supported when using the Inbox API.

If you need to split the workload across multiple regions, you can use the [HTTP API](/docs/server-side/communicating-with-workers/http-requests) instead.


### Server-side rendering
# Add Server-Side Rendering to your App

This guide will take your simple client-side app to the next level by showing you how to create a server-rendered page to publish your data to the world.

**Info:** 

If you haven't gone through the [front-end Quickstart](/docs/quickstart), you might find this guide a bit confusing. If you're looking for a quick reference, you might find [this page](/docs/project-setup#ssr-integration) more helpful!

## Creating an agent

For Jazz to access data on the server, we need to create an SSR agent, which is effectively a read-only user which can access public data stored in Jazz.

We can create this user using the `createSSRJazzAgent` function. In this example, we'll create a new file and export the agent, which allows us to import and use the same agent in multiple pages.

**File name: app/jazzSSR.ts**

```ts
import { createSSRJazzAgent } from "jazz-tools/ssr";

export const jazzSSR = createSSRJazzAgent({
  peer: "wss://cloud.jazz.tools/",
});

```

## Telling Jazz to use the SSR agent

Normally, Jazz expects a logged in user (or an anonymous user) to be accessing data. We can use the `enableSSR` setting to tell Jazz that this may not be the case, and the data on the page may be being accessed by an agent.

**File name: app/components/JazzWrapper.tsx**

```tsx
"use client";
import { JazzReactProvider } from "jazz-tools/react";
import { JazzFestAccount } from "./schema";

const apiKey = process.env.NEXT_PUBLIC_JAZZ_API_KEY;

export function JazzWrapper({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{ peer: `wss://cloud.jazz.tools/?key=${apiKey}` }}
      AccountSchema={JazzFestAccount}
      enableSSR // [!code ++]
    >
      {children}
    </JazzReactProvider>
  );
}

```

## Making your data public

By default, when you create data in Jazz, it's private and only accessible to the account that created it.

However, the SSR agent is credential-less and unauthenticated, so it can only read data which has been made public. Although Jazz allows you to define [complex, role-based permissions](/docs/permissions-and-sharing/overview), here, we'll focus on making the CoValues public.

**File name: app/schema.ts**

```ts
import { co, z } from "jazz-tools";

export const Band = co
  .map({
    name: z.string(), // Zod primitive type
  })
  // [!code ++:3]
  .withMigration((band) => {
    band.$jazz.owner.makePublic();
  });

export const Festival = co.list(Band);

export const JazzFestAccountRoot = co.map({
  myFestival: Festival,
});

export const JazzFestAccount = co
  .account({
    root: JazzFestAccountRoot,
    profile: co.profile(),
  })
  .withMigration(async (account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        myFestival: [],
      });

      // [!code ++:8]
      if (account.root.$isLoaded) {
        const { myFestival } = await account.root.$jazz.ensureLoaded({
          resolve: {
            myFestival: true,
          },
        });
        myFestival.$jazz.owner.makePublic();
      }
    }
  });

```

## Creating a server-rendered page

Now let's set up a page which will be read by the agent we created earlier, and rendered fully on the server.

**File name: app/festival/\[festivalId\]/page.tsx**

```tsx
import { jazzSSR } from "@/app/jazzSSR";
import { Festival } from "@/app/schema";

export default async function ServerSidePage(props: {
  params: { festivalId: string };
}) {
  const { festivalId } = await props.params;
  const festival = await Festival.load(festivalId, {
    loadAs: jazzSSR,
    resolve: {
      $each: {
        $onError: "catch",
      },
    },
  });

  return (
    <main>
      <h1>🎪 Server-rendered Festival {festivalId}</h1>

      <ul>
        {festival.$isLoaded &&
          festival.map((band) => {
            if (!band.$isLoaded) return null;
            return <li key={band.$jazz.id}>🎶 {band.name}</li>;
          })}
      </ul>
    </main>
  );
}

```

**Info:** 

TypeScript might not recognise that `params` is a promise. This is a new feature in Next.js 15, which you can [read more about here](https://nextjs.org/docs/messages/sync-dynamic-apis).

## Linking to your server-rendered page

The last step is to link to your server-rendered page from your `Festival` component so that you can find it easily!

**File name: app/components/Festival.tsx**

```tsx
"use client";
import { useAccount } from "jazz-tools/react";
// [!code ++:1]
import Link from "next/link";
import { JazzFestAccount } from "@/app/schema";

export function Festival() {
  const me = useAccount(JazzFestAccount, {
    resolve: { root: { myFestival: { $each: { $onError: "catch" } } } },
  });
  if (!me.$isLoaded) return null;
  return (
    <>
      <ul>
        {me.root.myFestival.map((band) => {
          if (!band.$isLoaded) return null;
          return <li key={band.$jazz.id}>{band.name}</li>;
        })}
      </ul>
      {/* [!code ++:3] */}
      <Link href={`/festival/${me.root.myFestival.$jazz.id}`}>
        Go to my Server-Rendered Festival Page!
      </Link>
    </>
  );
}

```

## Start your app

Let's fire up your app and see if it works!

```bash
npm run dev

```

If everything's going according to plan, your app will load with the home page. You can click the link to your server-rendered page to see your data - fully rendered on the server!

**Congratulations! 🎉** You've now set up server-side rendering in your React app. You can use this same pattern to render any page on the server.

### Not working?

* Did you add `enableSSR` to the provider?
* Did you add `loadAs: jazzSSR` to `Festival.load`?
* Did you add the migrations to make the data public?

**Info: Still stuck?** Ask for help on [Discord](https://discord.gg/utDMjHYg42)!

## Bonus: making the server-rendered page dynamic

Just like client-side pages, Jazz can update server-rendered pages in real-time.

For that we can use `export` to serialize values from Jazz and pass them to a client component:

**File name: app/festival/\[festivalId\]/page.tsx**

```tsx
import { jazzSSR } from "@/app/jazzSSR";
import { Festival } from "@/app/schema";
import { FestivalComponent } from "./FestivalComponent";

export default async function ServerSidePage(props: {
  params: { festivalId: string };
}) {
  const { festivalId } = await props.params;
  const festival = await Festival.load(festivalId, {
    loadAs: jazzSSR,
    resolve: {
      $each: {
        $onError: "catch",
      },
    },
  });

  if (!festival.$isLoaded) return <div>Festival not found</div>;

  return (
    // [!code ++:1]
    <FestivalComponent preloaded={festival.$jazz.export()} festivalId={festivalId} />
  );
}

```

Then we can pass the exported value to the preloaded option of the `useCoState` hook.

This way Jazz can synchronously hydrate the CoValue data directly from the component props, avoiding the need to load the data:

**File name: app/festival/\[festivalId\]/FestivalComponent.tsx**

```tsx
"use client";
import { Festival } from "@/app/schema";
// [!code ++:2]
import { ExportedCoValue, co } from "jazz-tools";
import { useCoState } from "jazz-tools/react";

// [!code ++:1]
type ExportedFestival = ExportedCoValue<co.loaded<typeof Festival, { $each: { $onError: "catch" } }>>;

export function FestivalComponent(props: { preloaded: ExportedFestival, festivalId: string }) {
  const festival = useCoState(Festival, props.festivalId, {
    // [!code ++:1]
    preloaded: props.preloaded,
    resolve: {
      $each: {
        $onError: "catch",
      },
    },
  });

  return (
    <main>
      <h1>🎪 Server-rendered Festival {props.festivalId}</h1>

      <ul>
        {festival.$isLoaded &&
          festival.map((band) => {
            if (!band.$isLoaded) return null;
            return <li key={band.$jazz.id}>🎶 {band.name}</li>;
          })}
      </ul>
    </main>
  );
}

```

Now your festival page will update in real-time, without needing to reload the page.

## Next steps

* Learn more about how to [manage complex permissions](/docs/permissions-and-sharing/overview) using groups and roles
* Dive deeper into the collaborative data structures we call [CoValues](/docs/core-concepts/covalues/overview)
* Learn more about migrations in the [accounts and migrations docs](/docs/core-concepts/schemas/accounts-and-migrations)


## Project setup

### Providers


## Tooling & Resources

### create-jazz-app
# create-jazz-app

Jazz comes with a CLI tool that helps you quickly scaffold new Jazz applications. There are two main ways to get started:

1. **Starter templates** \- Pre-configured setups to start you off with your preferred framework
2. **Example apps** \- Extend one of our [example applications](https://jazz.tools/examples) to build your project

## Quick Start with Starter Templates

Create a new Jazz app from a starter template in seconds:

```bash
npx create-jazz-app@latest --api-key YOUR_API_KEY

```

**Info: Tip** 

Sign up for a free API key at [dashboard.jazz.tools](https://dashboard.jazz.tools) for higher limits or production use, or use your email address as a temporary key to get started quickly.

**File name: .env**

```bash
NEXT_PUBLIC_JAZZ_API_KEY="you@example.com" # or your API key

```

This launches an interactive CLI that guides you through selecting:

* Pre-configured frameworks and authentication methods (See [Available Starters](#available-starters))
* Package manager
* Project name
* Jazz Cloud API key (optional) - Provides seamless sync and storage for your app

## Command Line Options

If you know what you want, you can specify options directly from the command line:

```bash
# Basic usage with project name
npx create-jazz-app@latest my-app --framework react --api-key YOUR_API_KEY

# Specify a starter template
npx create-jazz-app@latest my-app --starter react-passkey-auth --api-key YOUR_API_KEY

# Specify example app
npx create-jazz-app@latest my-app --example chat --api-key YOUR_API_KEY

```

### Available Options

* `directory` \- Directory to create the project in (defaults to project name)
* `-f, --framework` \- Framework to use (React, React Native, Svelte)
* `-s, --starter` \- Starter template to use
* `-e, --example` \- Example project to use
* `-p, --package-manager` \- Package manager to use (npm, yarn, pnpm, bun, deno)
* `-k, --api-key` \- Jazz Cloud API key (during our [free public alpha](/docs/core-concepts/sync-and-storage#free-public-alpha), you can use your email as the API key)
* `-h, --help` \- Display help information

## Start From an Example App

Want to start from one of [our example apps](https://jazz.tools/examples)? Our example apps include specific examples of features and use cases. They demonstrate real-world patterns for building with Jazz. Use one as your starting point:

```bash
npx create-jazz-app@latest --example chat

```

## Available Starters

Starter templates are minimal setups that include the basic configuration needed to get started with Jazz. They're perfect when you want a clean slate to build on.

Choose from these ready-to-use starter templates:

* `react-passkey-auth` \- React with Passkey authentication (easiest to start with)
* `react-clerk-auth` \- React with Clerk authentication
* `svelte-passkey-auth` \- Svelte with Passkey authentication
* `rn-clerk-auth` \- React Native with Clerk authentication

Run `npx create-jazz-app --help` to see the latest list of available starters.

## What Happens Behind the Scenes

When you run `create-jazz-app`, we'll:

1. Ask for your preferences (or use your command line arguments)
2. Clone the appropriate starter template
3. Update dependencies to their latest versions
4. Install all required packages
5. Set up your project and show next steps

## Requirements

* Node.js 20.0.0 or later
* Your preferred package manager (npm, yarn, pnpm, bun, or deno)


### Inspector
# Jazz Inspector

[Jazz Inspector](https://inspector.jazz.tools) is a tool to visually inspect a Jazz account or other CoValues.

To pass your account credentials, go to your Jazz app, copy the full JSON from the `jazz-logged-in-secret` local storage key, and paste it into the Inspector's Account ID field.

Alternatively, you can pass the Account ID and Account Secret separately.

<https://inspector.jazz.tools>

## Exporting current account to Inspector from your app

In development mode, you can launch the Inspector from your Jazz app to inspect your account by pressing `Cmd+J`.

## Embedding the Inspector widget into your app \[!framework=react,svelte,vue,vanilla\]

You can also embed the Inspector directly into your app, so you don't need to open a separate window.

```tsx
import { JazzInspector } from "jazz-tools/inspector";
import { JazzReactProvider } from "jazz-tools/react";

function App() {
  return (
    <JazzReactProvider>
      {/* [!code ++] */}
      <JazzInspector />
    </JazzReactProvider>
  );
}

```

This will show the Inspector launch button on the right of your page.

### Positioning the Inspector button \[!framework=react\]

You can also customize the button position with the following options:

* right (default)
* left
* bottom right
* bottom left
* top right
* top left

For example:

```tsx
<JazzInspector position="bottom left" />

```

Your app

Check out the [music player app](https://github.com/garden-co/jazz/blob/main/examples/music-player/src/2%5Fmain.tsx) for a full example.


### AI tools (llms.txt)
# Using AI to build Jazz apps

AI tools, particularly large language models (LLMs), can accelerate your development with Jazz. Searching docs, responding to questions and even helping you write code are all things that LLMs are starting to get good at.

However, Jazz is a rapidly evolving framework, so sometimes AI might get things a little wrong.

To help the LLMs, we provide the Jazz documentation in a txt file that is optimized for use with AI tools, like Cursor.

[llms-full.txt](/react/llms-full.txt) 

## Setting up AI tools

Every tool is different, but generally, you'll need to either paste the contents of the [llms-full.txt](https://jazz.tools/llms-full.txt) file directly in your prompt, or attach the file to the tool.

### ChatGPT and v0

Upload the txt file in your prompt.

![ChatGPT prompt with llms-full.txt attached](/chatgpt-with-llms-full-txt.jpg)

### Cursor

1. Go to Settings > Cursor Settings > Features > Docs
2. Click "Add new doc"
3. Enter the following URL:

```
https://jazz.tools/llms-full.txt

```

## llms.txt convention

We follow the llms.txt [proposed standard](https://llmstxt.org/) for providing documentation to AI tools at inference time that helps them understand the context of the code you're writing.

## Limitations and considerations

AI is amazing, but it's not perfect. What works well this week could break next week (or be twice as good).

We're keen to keep up with changes in tooling to help support you building the best apps, but if you need help from humans (or you have issues getting set up), please let us know on [Discord](https://discord.gg/utDMjHYg42).


### FAQs
# Frequently Asked Questions

## How established is Jazz?

Jazz is backed by fantastic angel and institutional investors with experience and know-how in devtools and has been in development since 2020.

## Will Jazz be around long-term?

We're committed to Jazz being around for a long time! We understand that when you choose Jazz for your projects, you're investing time and making a significant architectural choice, and we take that responsibility seriously. That's why we've designed Jazz with longevity in mind from the start:

* The open source nature of our sync server means you'll always be able to run your own infrastructure
* Your data remains accessible even if our cloud services change
* We're designing the protocol as an open specification

This approach creates a foundation that can continue regardless of any single company's involvement. The local-first architecture means your apps will always work, even offline, and your data remains yours.

## How secure is my data?

Jazz encrypts all your data by default using modern cryptographic standards. Every transaction is cryptographically signed, and data is encrypted using industry-standard algorithms including BLAKE3 hashing, Ed25519 signatures, and XSalsa20 stream ciphers.

Key features of Jazz's security:

* **Privacy by default**: Your data is encrypted even on Jazz Cloud servers
* **Automatic key rotation**: When members are removed from Groups, encryption keys rotate automatically
* **Verifiable authenticity**: Every change is cryptographically signed
* **Zero-trust architecture**: Only people you explicitly grant access can read your data

For technical details, see our [encryption documentation](/docs/reference/encryption).

## Does Jazz use Non-standard cryptography?

Jazz uses BLAKE3, XSalsa20, and Ed25519, which are all widely published and publicly reviewed standard cryptographic algorithms.

Although we're not lawyers, and so can't give legal advice, we believe that Jazz does not use 'Non-standard cryptography' as defined in the [BIS requirements](https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-772#p-772.1%28Non-standard%20cryptography%29) and therefore the requirements for publishing Jazz apps in the Apple App Store.


### Encryption
# Encryption

Jazz uses proven cryptographic primitives in a novel, but simple protocol to implement auditable permissions while allowing real-time collaboration and offline editing.

## How encryption works

Jazz uses proven cryptographic primitives in a novel, but simple protocol to implement auditable permissions while allowing real-time collaboration and offline editing.

### Write permissions: Signing with your keys

When you create or modify CoValues, Jazz cryptographically signs every transaction:

* All transactions are signed with your account's signing keypair
* This proves the transaction came from you
* Whether transactions are valid depends on your permissions in the Group that owns the CoValue
* Groups have internal logic ensuring only admins can change roles or create invites
* You can add yourself to a Group only with a specific role via invites

### Read permissions: Symmetric encryption

Groups use a shared "read key" for encrypting data:

* Admins reveal this symmetric encryption key to accounts with "reader" role or higher
* All transactions in CoValues owned by that Group are encrypted with the current read key
* When someone is removed from a Group, the read key rotates and gets revealed to all remaining members
* CoValues start using the new read key for future transactions

This means removed members can't read new data, but existing data they already had access to remains readable to them.

## Key rotation and security

Jazz automatically handles key management:

* **Member removal triggers rotation**: When you remove someone from a Group, Jazz generates a new read key
* **Seamless transition**: New transactions use the new key immediately
* **No data loss**: Existing members get the new key automatically

## Streaming encryption

Jazz encrypts data efficiently for real-time collaboration:

* **Incremental hashing**: CoValue sessions use [BLAKE3](https://github.com/BLAKE3-team/BLAKE3) for append-only hashing
* **Session signatures**: Each session is signed with [Ed25519](https://ed25519.cr.yp.to/) after each transaction
* **Stream ciphers**: Data is encrypted using [XSalsa20](https://cr.yp.to/salsa20.html) stream cipher
* **Integrity protection**: Hashing and signing ensure data hasn't been tampered with

Although we're not lawyers, and so can't give legal advice, the encryption algorithms used in Jazz are widely published. As a result, we believe that Jazz does not use 'Non-standard cryptography' per the [BIS requirements](https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-772#p-772.1%28Non-standard%20cryptography%29) (and therefore the requirements for publishing Jazz apps in the Apple App Store).

## Content addressing

CoValue IDs are the [BLAKE3](https://github.com/BLAKE3-team/BLAKE3) hash of their immutable "header" (containing CoValue type and owning group). This allows CoValues to be "content addressed" while remaining dynamic and changeable.

## What this means for you

**Privacy by default**: Your data is always encrypted, even on Jazz Cloud servers. Only people you explicitly give access to can read your data.

**Flexible permissions**: Use Groups to control exactly who can read, write, or admin your CoValues.

**Automatic security**: Key rotation and encryption happen behind the scenes - you don't need to think about it.

**Verifiable authenticity**: Every change is cryptographically signed, so you always know who made what changes.

## Further reading

* [BLAKE3](https://github.com/BLAKE3-team/BLAKE3) \- append-only hashing
* [Ed25519](https://ed25519.cr.yp.to/) \- signature scheme
* [XSalsa20](https://cr.yp.to/salsa20.html) \- stream cipher for data encryption

### Implementation details

The cryptographic primitives are implemented in the [cojson/src/crypto](https://github.com/garden-co/jazz/tree/main/packages/cojson/src/crypto) package.

Key files to explore:

* [permissions.ts](https://github.com/garden-co/jazz/blob/main/packages/cojson/src/permissions.ts) \- Permission logic
* [permissions.test.ts](https://github.com/garden-co/jazz/blob/main/packages/cojson/src/tests/permissions.test.ts) \- Permission tests
* [verifiedState.ts](https://github.com/garden-co/jazz/blob/main/packages/cojson/src/coValueCore/verifiedState.ts) \- State verification
* [coValueCore.test.ts](https://github.com/garden-co/jazz/blob/main/packages/cojson/src/tests/coValueCore.test.ts) \- Core functionality tests


### Testing
# Testing Jazz Apps

As you develop your Jazz app, you might find yourself needing to test functionality relating to sync, identities, and offline behaviour. The `jazz-tools/testing` utilities provide helpers to enable you to do so.

## Core test helpers

Jazz provides some key helpers that you can use to simplify writing complex tests for your app's functionality.

### `setupJazzTestSync`

This should normally be the first thing you call in your test setup, for example in a `beforeEach` or `beforeAll` block. This function sets up an in-memory sync node for the test session, which is needed in case you want to test data synchronisation functionality. Test data is not persisted, and no clean-up is needed between test runs.

```ts
import { co, z } from "jazz-tools";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createJazzTestAccount,
  runWithoutActiveAccount,
  setActiveAccount,
  setupJazzTestSync,
} from "jazz-tools/testing";
const MyAccountSchema = co.account({
  profile: co.profile(),
  root: co.map({}),
});

describe("My app's tests", () => {
  beforeEach(async () => {
    await setupJazzTestSync();
  });

  test("I can create a test account", async () => {
    // See below for details on createJazzTestAccount()
    const account1 = await createJazzTestAccount({
      AccountSchema: MyAccountSchema,
      isCurrentActiveAccount: true,
    });
    expect(account1).not.toBeUndefined();
    // ...
  });
});

```

### `createJazzTestAccount`

After you've created the initial account using `setupJazzTestSync`, you'll typically want to create user accounts for running your tests.

You can use `createJazzTestAccount()` to create an account and link it to the sync node. By default, this account will become the currently active account (effectively the 'logged in' account).

You can use it like this:

```ts
const account = await createJazzTestAccount({
  AccountSchema: MyAccountSchema,
  isCurrentActiveAccount: true,
  creationProps: {},
});

```

#### `AccountSchema`

This option allows you to provide a custom account schema to the utility to be used when creating the account. The account will be created based on the schema, and all attached migrations will run.

#### `isCurrentActiveAccount`

This option (disabled by default) allows you to quickly switch to the newly created account when it is created.

```ts
const account1 = await createJazzTestAccount({
  isCurrentActiveAccount: true,
});

const group1 = co.group().create(); // Group is owned by account1;

const account2 = await createJazzTestAccount();
const group2 = co.group().create(); // Group is still owned by account1;

```

#### `creationProps`

This option allows you to specify `creationProps` for the account which are used during the account creation (and passed to the migration function on creation).

## Managing active Accounts

During your tests, you may need to manage the currently active account after account creation, or you may want to simulate behaviour where there is no currently active account.

### `setActiveAccount`

Use `setActiveAccount()` to switch between active accounts during a test run.

You can use this to test your app with multiple accounts.

```ts
const account1 = await createJazzTestAccount({
  isCurrentActiveAccount: true,
});
const account2 = await createJazzTestAccount();
const group1 = co.group().create(); // Group is owned by account1;
group1.addMember(account2, "reader");

const myMap = MyMap.create(
  {
    text: "Created by account1",
  },
  { owner: group1 },
);
const myMapId = myMap.$jazz.id;

setActiveAccount(account2);
// myMap is still loaded as account1, so we need to load again as account2
const myMapFromAccount2 = await MyMap.load(myMapId);

if (myMapFromAccount2.$isLoaded) {
  expect(myMapFromAccount2.text).toBe("Created by account1");
  expect(() =>
    myMapFromAccount2.$jazz.set("text", "Updated by account2"),
  ).toThrow();
}

```

### `runWithoutActiveAccount`

If you need to test how a particular piece of code behaves when run without an active account.

```ts
const account1 = await createJazzTestAccount({
  isCurrentActiveAccount: true,
});

runWithoutActiveAccount(() => {
  expect(() => co.group().create()).toThrow(); // can't create new group
});

```

## Managing Context

To test UI components, you may need to create a mock Jazz context.

In most cases, you'd use this for initialising a provider. You can see how we [initialise a test provider for React tests here](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/react-core/testing.tsx), or see how you could [integrate with @testing-library/react here](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/react-core/tests/testUtils.tsx).

### Simulating connection state changes

You can use `MockConnectionStatus.setIsConnected(isConnected: boolean)` to simulate disconnected and connected states (depending on whether `isConnected` is set to `true` or `false`).

## Next Steps

You're ready to start writing your own tests for your Jazz apps now. For further details and reference, you can check how we do our testing below.

* [Unit test examples](https://github.com/garden-co/jazz/tree/main/packages/jazz-tools/src/tools/tests)
* [End-to-end examples](https://github.com/garden-co/jazz/tree/main/tests/e2e/tests)
* [React-specific tests](https://github.com/garden-co/jazz/tree/main/packages/jazz-tools/src/react-core/tests)


### Performance tips
# Tips for maximising Jazz performance

## Use the best crypto implementation for your platform

The fastest implementations are (in order):

1. [Node-API crypto](/docs/server-side/setup#node-api) (only available in some Node/Deno environments) or [RNQuickCrypto on React Native](/docs/react-native/project-setup/providers#quick-crypto)
2. [WASM crypto](/docs/server-side/setup#wasm-on-edge-runtimes)
3. JavaScript fallback (slowest, but most compatible)

Check whether your environment supports Node-API. Some edge runtimes may not enable WASM by default.

## Minimise group extensions

Group extensions make it easy to cascade permissions and they’re fast enough for most cases. However, performance can slow down when many parent groups need to load in the dependency chain. To avoid this, create and reuse groups manually when their permissions stay the same for both CoValues over time.

**Note**: Implicit CoValue creation extends groups automatically. Be careful about how you create nested CoValues if you are likely to build long dependency chains.

```ts
const SubSubItem = co.map({
  name: z.string(),
});
const SubItem = co.map({
  subSubItem: SubSubItem,
});
const Item = co.map({
  subItem: SubItem,
});

// Implicit CoValue creation
// Results in Group extension for subItem and subSubItem's owners.
const item = Item.create({
  subItem: {
    subSubItem: {
      name: "Example",
    },
  },
});

// Explicit CoValue creation
// Does not result in Group extension.
const fasterItem = Item.create({
  subItem: SubItem.create({
    subSubItem: SubSubItem.create({
      name: "Example",
    }),
  }),
});

// Alternative
const subSubItem = SubSubItem.create({ name: "Example" });
const subItem = SubItem.create({ subSubItem: subSubItem });
const fasterItem = Item.create({ subItem: subItem });

```

## Choose simple datatypes where possible

CoValues will always be slightly slower to load than their primitive counterparts. For most cases, this is negligible.

In data-heavy apps where lots of data has to be loaded at the same time, you can choose to trade off some of the flexibility of CoValues for speed by opting for primitive data types.

### `z.string()` vs CoTexts

In case you use a CoText, Jazz will enable character-by-character collaboration possibilities for you. However, in many cases, users do not expect to be able to collaborate on the text itself, and are happy with replacing the whole string at once, especially shorter strings. In this case, you could use a `z.string()` for better performance.

Examples:

* names
* URLs
* phone numbers

### `z.object()/z.tuple()` vs CoMaps

CoMaps allow granular updates to objects based on individual keys. If you expect your whole object to be updated at once, you could consider using the `z.object()` or `z.tuple()` type. Note that if you use these methods, you must replace the whole value if you choose to update it.

Examples:

* locations/co-ordinates
* data coming from external sources
* data which is rarely changed after it is created

```ts
const Sprite = co.map({
  position: z.object({ x: z.number(), y: z.number() }),
});

const Location = co.map({
  position: z.tuple([z.number(), z.number()]),
});

const mySprite = Sprite.create({ position: { x: 10, y: 10 } });
mySprite.$jazz.set("position", { x: 20, y: 20 });
// You cannot update 'x' and 'y' independently, only replace the whole object

const myLocation = Location.create({ position: [26.052, -80.209] });
myLocation.$jazz.set("position", [-33.868, -63.987]);
// Note: you cannot replace a single array element, only replace the whole tuple

```

### Avoid expensive selectors \[!framework=react\]

Using selectors is a great way to avoid unnecessary re-renders in your app. However, an expensive selector will cause your app to run slowly as the selector will re-run every time the CoValue updates.

In case you need to run expensive computations on your CoValues, [extract this into a separate useMemo call](/docs/react/core-concepts/subscription-and-loading#avoiding-expensive-selectors).


### Forms
# How to write forms with Jazz

This guide shows you a simple and powerful way to implement forms for creating and updating CoValues.

[See the full example here.](https://github.com/garden-co/jazz/tree/main/examples/form)

## Updating a CoValue

To update a CoValue, we simply assign the new value directly as changes happen. These changes are synced to the server.

```tsx
<input
  type="text"
  value={order.name}
  onChange={(e) => order.$jazz.set("name", e.target.value)}
/>;

```

It's that simple!

## Creating a CoValue

When creating a CoValue, we can use a partial version that allows us to build up the data before submitting.

### Using a Partial CoValue

Let's say we have a CoValue called `BubbleTeaOrder`. We can create a partial version,`PartialBubbleTeaOrder`, which has some fields made optional so we can build up the data incrementally.

**File name: schema.ts**

```ts
import { co, z } from "jazz-tools";

export const BubbleTeaOrder = co.map({
  name: z.string(),
});
export type BubbleTeaOrder = co.loaded<typeof BubbleTeaOrder>;

export const PartialBubbleTeaOrder = BubbleTeaOrder.partial();
export type PartialBubbleTeaOrder = co.loaded<typeof PartialBubbleTeaOrder>;

```

## Writing the components in React

Let's write the form component that will be used for both create and update.

```tsx
import { co } from "jazz-tools";
import { BubbleTeaOrder, PartialBubbleTeaOrder } from "./schema";

export function OrderForm({
  order,
  onSave,
}: {
  order: BubbleTeaOrder | PartialBubbleTeaOrder;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSave || ((e) => e.preventDefault())}>
      <label>
        Name
        <input
          type="text"
          value={order.name}
          onChange={(e) => order.$jazz.set("name", e.target.value)}
          required
        />
      </label>

      {onSave && <button type="submit">Submit</button>}
    </form>
  );
}

```

### Writing the edit form

To make the edit form, simply pass the `BubbleTeaOrder`. Changes are automatically saved as you type.

```tsx
export function EditOrder(props: { id: string }) {
  const order = useCoState(BubbleTeaOrder, props.id);

  if (!order.$isLoaded) return;

  return <OrderForm order={order} />;
}

```

### Writing the create form

For the create form, we need to:

1. Create a partial order.
2. Edit the partial order.
3. Convert the partial order to a "real" order on submit.

Here's how that looks like:

```tsx
export function CreateOrder(props: { id: string }) {
  const orders = useAccount(JazzAccount, {
    resolve: { root: { orders: true } },
    select: (account) => (account.$isLoaded ? account.root.orders : undefined),
  });

  const newOrder = useCoState(PartialBubbleTeaOrder, props.id);

  if (!newOrder.$isLoaded || !orders) return;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Convert to real order and add to the list
    // Note: the name field is marked as required in the form, so we can assume that has been set in this case
    // In a more complex form, you would need to validate the partial value before storing it
    orders.$jazz.push(newOrder as BubbleTeaOrder);
  };

  return <OrderForm order={newOrder} onSave={handleSave} />;
}

```

## Editing with a save button

If you need a save button for editing (rather than automatic saving), you can use Jazz's branching feature. The example app shows how to create a private branch for editing that can be merged back when the user saves:

```tsx
import { Group } from "jazz-tools";
import { useState, useMemo } from "react";

export function EditOrderWithSave(props: { id: string }) {
  // Create a new group for the branch, so that every time we open the edit page,
  // we create a new private branch
  const owner = useMemo(() => Group.create(), []);

  const order = useCoState(BubbleTeaOrder, props.id, {
    resolve: {
      addOns: { $each: true, $onError: "catch" },
      instructions: true,
    },
    unstable_branch: {
      name: "edit-order",
      owner,
    },
  });

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order.$isLoaded) return;

    // Merge the branch back to the original
    order.$jazz.unstable_merge();
    // Navigate away or show success message
  }

  function handleCancel() {
    // Navigate away without saving - the branch will be discarded
  }

  if (!order.$isLoaded) return;

  return <OrderForm order={order} onSave={handleSave} />;
}

```

This approach creates a private branch using `unstable_branch` with a unique owner group. The user can edit the branch without affecting the original data, and changes are only persisted when they click save via `unstable_merge()`.

**Info:** 

**Important:** Version control is currently unstable and we may ship breaking changes in patch releases.

## Handling different types of data

Forms can be more complex than just a single string field, so we've put together an example app that shows you how to handle single-select, multi-select, date, boolean inputs, and rich text.

[See the full example here.](https://github.com/garden-co/jazz/tree/main/examples/form)


### Organization/Team
# How to share data between users through Organizations

This guide shows you how to share a set of CoValues between users. Different apps have different names for this concept, such as "teams" or "workspaces".

We'll use the term Organization.

[See the full example here.](https://github.com/garden-co/jazz/tree/main/examples/organization)

## Defining the schema for an Organization

Create a CoMap shared by the users of the same organization to act as a root (or "main database") for the shared data within an organization.

For this example, users within an `Organization` will be sharing `Project`s.

**File name: schema.ts**

```ts
export const Project = co.map({
  name: z.string(),
});

export const Organization = co.map({
  name: z.string(),

  // shared data between users of each organization
  projects: co.list(Project),
});

export const ListOfOrganizations = co.list(Organization);

```

Learn more about [defining schemas](/docs/core-concepts/covalues/overview).

## Adding a list of Organizations to the user's Account

Let's add the list of `Organization`s to the user's Account `root` so they can access them.

```tsx
export const JazzAccountRoot = co.map({
  organizations: co.list(Organization),
});

export const JazzAccount = co
  .account({
    root: JazzAccountRoot,
    profile: co.profile(),
  })
  .withMigration((account) => {
    if (!account.$jazz.has("root")) {
      // Using a Group as an owner allows you to give access to other users
      const organizationGroup = Group.create();

      const organizations = co.list(Organization).create([
        // Create the first Organization so users can start right away
        Organization.create(
          {
            name: "My organization",
            projects: co.list(Project).create([], organizationGroup),
          },
          organizationGroup,
        ),
      ]);
      account.$jazz.set("root", { organizations });
    }
  });

```

This schema now allows users to create `Organization`s and add `Project`s to them.

[See the schema for the example app here.](https://github.com/garden-co/jazz/blob/main/examples/organization/src/schema.ts)

## Adding members to an Organization

Here are different ways to add members to an `Organization`.

* Send users an invite link.
* [The user requests to join.](/docs/permissions-and-sharing/sharing#requesting-invites)

This guide and the example app show you the first method.

### Adding members through invite links

Here's how you can generate an [invite link](/docs/permissions-and-sharing/sharing#invites).

When the user accepts the invite, add the `Organization` to the user's `organizations` list.

```tsx
import { useAcceptInvite } from "jazz-tools/react";

useAcceptInvite({
  invitedObjectSchema: Organization,
  onAccept: async (organizationID) => {
    const organization = await Organization.load(organizationID);
    if (!organization.$isLoaded)
      throw new Error("Organization could not be loaded");
    me.root.organizations.$jazz.push(organization);
    // navigate to the organization page
  },
});

```

## Further reading

* [Allowing users to request an invite to join a Group](/docs/permissions-and-sharing/sharing#requesting-invites)
* [Groups as permission scopes](/docs/permissions-and-sharing/overview#adding-group-members-by-id)


### History Patterns
# History Patterns

Jazz's automatic history tracking enables powerful patterns for building collaborative features. Here's how to implement common history-based functionality.

## Audit Logs

Build a complete audit trail showing all changes to your data:

```ts
function getAuditLog(task: Task) {
  const changes: {
    field: string;
    value: Task[keyof Task] | undefined;
    by: Account | null;
    at: Date;
  }[] = [];

  // Collect edits for all fields
  const fields = Object.keys(task);
  const edits = task.$jazz.getEdits();
  for (const field of fields) {
    const editField = field as keyof typeof edits;
    if (!edits[editField]) continue;

    for (const edit of edits[editField].all) {
      changes.push({
        field,
        value: edit.value,
        by: edit.by,
        at: edit.madeAt,
      });
    }
  }

  // Sort by timestamp (newest first)
  return changes.sort((a, b) => b.at.getTime() - a.at.getTime());
}

// Use it to show change history
const auditLog = getAuditLog(task);
auditLog.forEach((entry) => {
  if (!entry.by?.profile?.$isLoaded) return;
  const when = entry.at.toLocaleString();
  const who = entry.by.profile.name;
  const what = entry.field;
  const value = entry.value;

  console.log(`${when} - ${who} changed ${what} to "${value}"`);
  // 22/05/2025, 12:00:00 - Alice changed title to "New task"
});

```

## Activity Feeds

Show recent activity across your application:

```ts
function getRecentActivity(projects: Project[], since: Date) {
  const activity: {
    project: string;
    field: string;
    value: Task[keyof Task] | undefined;
    by: Account | null;
    at: Date;
  }[] = [];

  for (const project of projects) {
    // Get all fields that might have edits
    const fields = Object.keys(project);

    // Check each field for edit history
    const edits = project.$jazz.getEdits();
    for (const field of fields) {
      const editField = field as keyof typeof edits;
      // Skip if no edits exist for this field
      if (!edits[editField]) continue;

      for (const edit of edits[editField].all) {
        // Only include edits made after the 'since' date
        if (edit.madeAt > since) {
          activity.push({
            project: project.name,
            field,
            value: edit.value,
            by: edit.by,
            at: edit.madeAt,
          });
        }
      }
    }
  }

  return activity.sort((a, b) => b.at.getTime() - a.at.getTime());
}

// Show activity from the last hour
const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentActivity = getRecentActivity(myProjects, hourAgo);
// [{
//   project: "New project",
//   field: "name",
//   value: "New project",
//   by: Account,
//   at: Date
// }]

```

## Change Indicators

Show when something was last updated:

```ts
function getLastUpdated(task: Task) {
  // Find the most recent edit across all fields
  let lastEdit: CoMapEdit<unknown> | null = null;

  const edits = task.$jazz.getEdits();
  for (const field of Object.keys(task)) {
    const editField = field as keyof typeof edits;
    // Skip if no edits exist for this field
    if (!edits[editField]) continue;

    const fieldEdit = edits[editField];
    if (fieldEdit && (!lastEdit || fieldEdit.madeAt > lastEdit.madeAt)) {
      lastEdit = fieldEdit;
    }
  }

  if (!lastEdit || !lastEdit.by?.profile?.$isLoaded) return null;

  return {
    updatedBy: lastEdit.by.profile.name,
    updatedAt: lastEdit.madeAt,
    message: `Last updated by ${lastEdit.by.profile.name} at ${lastEdit.madeAt.toLocaleString()}`,
  };
}

const lastUpdated = getLastUpdated(task);
console.log(lastUpdated?.message);
// "Last updated by Alice at 22/05/2025, 12:00:00"

```

## Finding Specific Changes

Query history for specific events:

```ts
// Find when a task was completed
function findCompletionTime(task: Task): Date | null {
  const statusEdits = task.$jazz.getEdits().status;
  if (!statusEdits) return null;

  // find() returns the FIRST completion time
  // If status toggles (completed → in-progress → completed),
  // this gives you the earliest completion, not the latest
  const completionEdit = statusEdits.all.find(
    (edit) => edit.value === "completed",
  );

  return completionEdit?.madeAt || null;
}

// To get the LATEST completion time instead reverse the array, then find:
function findLatestCompletionTime(task: Task): Date | null {
  const statusEdits = task.$jazz.getEdits().status;
  if (!statusEdits) return null;

  // Reverse and find (stops at first match)
  const latestCompletionEdit = statusEdits.all
    .slice() // Create copy to avoid mutating original
    .reverse()
    .find((edit) => edit.value === "completed");

  return latestCompletionEdit?.madeAt || null;
}

console.log(findCompletionTime(task)); // First completion
console.log(findLatestCompletionTime(task)); // Most recent completion

// Find who made a specific change
function findWhoChanged(task: Task, field: string, value: any) {
  const taskEdits = task.$jazz.getEdits();
  const fieldEdits = taskEdits[field as keyof typeof taskEdits];
  if (!fieldEdits) return null;

  const matchingEdit = fieldEdits.all.find((edit) => edit.value === value);
  return matchingEdit?.by || null;
}
const account = findWhoChanged(task, "status", "completed");
if (account?.profile?.$isLoaded) {
  console.log(account.profile.name);
}
// Alice

```

## Further Reading

* [History](/docs/key-features/history) \- Complete reference for the history API
* [Subscription & Loading](/docs/core-concepts/subscription-and-loading) \- Ensure CoValues are loaded before accessing history


## Resources

- [Documentation](https://jazz.tools/docs): Detailed documentation about Jazz
- [Examples](https://jazz.tools/examples): Code examples and tutorials

## music-player Example

### 1_schema.ts

```ts
import { co, Group, z } from "jazz-tools";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of tasks, lists of tasks and projects
 *  using CoJSON's collaborative map and list types, CoMap & CoList.
 *
 *  CoMap values and CoLists items can contain:
 *  - arbitrary immutable JSON
 *  - other CoValues
 **/

export const MusicTrackWaveform = co.map({
  data: z.array(z.number()),
});
export type MusicTrackWaveform = co.loaded<typeof MusicTrackWaveform>;

export const MusicTrack = co.map({
  /**
   *  Attributes are defined using zod schemas
   */
  title: z.string(),
  duration: z.number(),

  /**
   * You can define relations between coValues using the other CoValue schema
   * You can mark them optional using z.optional()
   */
  waveform: MusicTrackWaveform,

  /**
   * In Jazz you can upload files using FileStream.
   *
   * As for any other coValue the music files we put inside FileStream
   * is available offline and end-to-end encrypted 😉
   */
  file: co.fileStream(),

  isExampleTrack: z.optional(z.boolean()),
});
export type MusicTrack = co.loaded<typeof MusicTrack>;

export const Playlist = co.map({
  title: z.string(),
  tracks: co.list(MusicTrack), // CoList is the collaborative version of Array
});
export type Playlist = co.loaded<typeof Playlist>;

export const PlaylistWithTracks = Playlist.resolved({
  tracks: { $each: true },
});
export type PlaylistWithTracks = co.loaded<typeof PlaylistWithTracks>;

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export const MusicaAccountRoot = co.map({
  // The root playlist works as container for the tracks that
  // the user has uploaded
  rootPlaylist: Playlist,
  // Here we store the list of playlists that the user has created
  // or that has been invited to
  playlists: co.list(Playlist),
  // We store the active track and playlist as coValue here
  // so when the user reloads the page can see the last played
  // track and playlist
  // You can also add the position in time if you want make it possible
  // to resume the song
  activeTrack: co.optional(MusicTrack),
  activePlaylist: Playlist,

  exampleDataLoaded: z.optional(z.boolean()),
  accountSetupCompleted: z.optional(z.boolean()),
});
export type MusicaAccountRoot = co.loaded<typeof MusicaAccountRoot>;

export const MusicaAccountProfile = co
  .profile({
    avatar: co.optional(co.image()),
  })
  .withMigration((profile) => {
    if (profile.$jazz.owner.getRoleOf("everyone") !== "reader") {
      profile.$jazz.owner.addMember("everyone", "reader");
    }
  });
export type MusicaAccountProfile = co.loaded<typeof MusicaAccountProfile>;

export const MusicaAccount = co
  .account({
    /** the default user profile with a name */
    profile: MusicaAccountProfile,
    root: MusicaAccountRoot,
  })
  .withMigration(async (account) => {
    /**
     *  The account migration is run on account creation and on every log-in.
     *  You can use it to set up the account root and any other initial CoValues you need.
     */
    if (!account.$jazz.has("root")) {
      const rootPlaylist = Playlist.create({
        tracks: [],
        title: "",
      });

      account.$jazz.set("root", {
        rootPlaylist,
        playlists: [],
        activeTrack: undefined,
        activePlaylist: rootPlaylist,
        exampleDataLoaded: false,
      });
    }

    if (!account.$jazz.has("profile")) {
      account.$jazz.set(
        "profile",
        MusicaAccountProfile.create(
          {
            name: "",
          },
          Group.create().makePublic(),
        ),
      );
    }
  });
export type MusicaAccount = co.loaded<typeof MusicaAccount>;

export const MusicaAccountWithPlaylists = MusicaAccount.resolved({
  root: {
    playlists: {
      $each: { $onError: "catch", ...PlaylistWithTracks.resolveQuery },
    },
  },
});

/** Walkthrough: Continue with ./2_main.tsx */

```

### 2_main.tsx

```tsx
import { Toaster } from "@/components/ui/toaster";
import { JazzInspector } from "jazz-tools/inspector";
/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { HomePage } from "./3_HomePage";
import { useMediaPlayer } from "./5_useMediaPlayer";
import { InvitePage } from "./6_InvitePage";
import { WelcomeScreen } from "./components/WelcomeScreen";
import "./index.css";

import { MusicaAccount } from "@/1_schema";
import { apiKey } from "@/apiKey.ts";
import { SidebarProvider } from "@/components/ui/sidebar";
import { JazzReactProvider } from "jazz-tools/react";
import { onAnonymousAccountDiscarded } from "./4_actions";
import { KeyboardListener } from "./components/PlayerControls";
import { usePrepareAppState } from "./lib/usePrepareAppState";
import {
  AccountProvider,
  useAccountSelector,
} from "@/components/AccountProvider.tsx";

/**
 * Walkthrough: The top-level provider `<JazzReactProvider/>`
 *
 * This shows how to use the top-level provider `<JazzReactProvider/>`,
 * which provides the rest of the app with a controlled account (used through `useAccount` later).
 * Here we use `DemoAuth` which is great for prototyping you app without wasting time on figuring out
 * the best way to do auth.
 *
 * `<JazzReactProvider/>` also runs our account migration
 */
function AppContent({
  mediaPlayer,
}: {
  mediaPlayer: ReturnType<typeof useMediaPlayer>;
}) {
  const showWelcomeScreen = useAccountSelector({
    select: (me) => !me.$isLoaded || !me.root.accountSetupCompleted,
  });

  const isReady = usePrepareAppState(mediaPlayer);

  // Show welcome screen if account setup is not completed
  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  const router = createHashRouter([
    {
      path: "/",
      element: <HomePage mediaPlayer={mediaPlayer} />,
    },
    {
      path: "/playlist/:playlistId",
      element: <HomePage mediaPlayer={mediaPlayer} />,
    },
    {
      path: "/invite/*",
      element: <InvitePage />,
    },
  ]);

  if (!isReady) return null;

  return (
    <>
      <RouterProvider router={router} />
      <KeyboardListener mediaPlayer={mediaPlayer} />
      <Toaster />
    </>
  );
}

function Main() {
  const mediaPlayer = useMediaPlayer();

  return (
    <SidebarProvider>
      <AppContent mediaPlayer={mediaPlayer} />
      <JazzInspector />
    </SidebarProvider>
  );
}

const peer =
  (new URL(window.location.href).searchParams.get(
    "peer",
  ) as `ws://${string}`) ?? `wss://cloud.jazz.tools/?key=${apiKey}`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzReactProvider
      sync={{
        peer,
      }}
      storage="indexedDB"
      AccountSchema={MusicaAccount}
      defaultProfileName="Anonymous unicorn"
      authSecretStorageKey="examples/music-player"
      onAnonymousAccountDiscarded={onAnonymousAccountDiscarded}
    >
      <SidebarProvider>
        <AccountProvider>
          <Main />
        </AccountProvider>
        <JazzInspector />
      </SidebarProvider>
    </JazzReactProvider>
  </React.StrictMode>,
);

```

### 3_HomePage.tsx

```tsx
import { useCoState } from "jazz-tools/react";
import { useParams } from "react-router";
import { PlaylistWithTracks } from "./1_schema";
import { uploadMusicTracks } from "./4_actions";
import { MediaPlayer } from "./5_useMediaPlayer";
import { FileUploadButton } from "./components/FileUploadButton";
import { MusicTrackRow } from "./components/MusicTrackRow";
import { PlayerControls } from "./components/PlayerControls";
import { EditPlaylistModal } from "./components/EditPlaylistModal";
import { PlaylistMembers } from "./components/PlaylistMembers";
import { MemberAccessModal } from "./components/MemberAccessModal";
import { SidePanel } from "./components/SidePanel";
import { Button } from "./components/ui/button";
import { SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import { usePlayState } from "./lib/audio/usePlayState";
import { useState } from "react";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

export function HomePage({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
  const playState = usePlayState();
  const isPlaying = playState.value === "play";
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  async function handleFileLoad(files: FileList) {
    /**
     * Follow this function definition to see how we update
     * values in Jazz and manage files!
     */
    await uploadMusicTracks(files);
  }

  const params = useParams<{ playlistId: string }>();
  const playlistId = useAccountSelector({
    select: (me) =>
      params.playlistId ??
      (me.$isLoaded ? me.root.$jazz.refs.rootPlaylist.id : undefined),
  });

  const playlist = useCoState(PlaylistWithTracks, playlistId, {
    select: (playlist) => (playlist.$isLoaded ? playlist : undefined),
  });

  const membersIds = playlist?.$jazz.owner.members.map((member) => member.id);
  const isRootPlaylist = !params.playlistId;
  const canEdit = useAccountSelector({
    select: (me) => Boolean(playlist && me.canWrite(playlist)),
  });
  const isActivePlaylist = useAccountSelector({
    select: (me) =>
      me.$isLoaded && playlistId === me.root.activePlaylist?.$jazz.id,
  });

  const handlePlaylistShareClick = () => {
    setIsMembersModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  return (
    <SidebarInset className="flex flex-col h-screen text-gray-800">
      <div className="flex flex-1 overflow-hidden">
        <SidePanel />
        <main className="flex-1 px-2 py-4 md:px-6 overflow-y-auto overflow-x-hidden relative sm:h-[calc(100vh-80px)] bg-white h-[calc(100vh-165px)]">
          <SidebarTrigger className="md:hidden" />

          <div className="flex flex-row items-center justify-between mb-4 pl-1 md:pl-10 pr-2 md:pr-0 mt-2 md:mt-0 w-full">
            {isRootPlaylist ? (
              <h1 className="text-2xl font-bold text-blue-800">All tracks</h1>
            ) : (
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-blue-800">
                  {playlist?.title}
                </h1>
                {membersIds && playlist && (
                  <PlaylistMembers
                    memberIds={membersIds}
                    onClick={() => setIsMembersModalOpen(true)}
                  />
                )}
              </div>
            )}
            <div className="flex items-center space-x-4">
              {isRootPlaylist && (
                <>
                  <FileUploadButton onFileLoad={handleFileLoad}>
                    Add file
                  </FileUploadButton>
                </>
              )}
              {!isRootPlaylist && canEdit && (
                <>
                  <Button onClick={handleEditClick} variant="outline">
                    Edit
                  </Button>
                  <Button onClick={handlePlaylistShareClick}>Share</Button>
                </>
              )}
            </div>
          </div>
          <ul className="flex flex-col max-w-full sm:gap-1">
            {playlist?.tracks?.map(
              (track, index) =>
                track && (
                  <MusicTrackRow
                    trackId={track.$jazz.id}
                    key={track.$jazz.id}
                    index={index}
                    isPlaying={
                      mediaPlayer.activeTrackId === track.$jazz.id &&
                      isActivePlaylist &&
                      isPlaying
                    }
                    onClick={() => {
                      mediaPlayer.setActiveTrack(track, playlist);
                    }}
                  />
                ),
            )}
          </ul>
        </main>
        <PlayerControls mediaPlayer={mediaPlayer} />
      </div>

      {/* Playlist Title Edit Modal */}
      <EditPlaylistModal
        playlistId={playlistId}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Members Management Modal */}
      {playlist && (
        <MemberAccessModal
          isOpen={isMembersModalOpen}
          onOpenChange={setIsMembersModalOpen}
          playlist={playlist}
        />
      )}
    </SidebarInset>
  );
}

```

### 4_actions.ts

```ts
import { getAudioFileData } from "@/lib/audio/getAudioFileData";
import { Group } from "jazz-tools";
import {
  MusicTrack,
  MusicaAccount,
  Playlist,
  PlaylistWithTracks,
} from "./1_schema";

/**
 * Walkthrough: Actions
 *
 * With Jazz is very simple to update the state, you
 * just mutate the values and we take care of triggering
 * the updates and sync  and persist the values you change.
 *
 * We have grouped the complex updates here in an actions file
 * just to keep them separated from the components.
 *
 * Jazz is very unopinionated in this sense and you can adopt the
 * pattern that best fits your app.
 */

export async function uploadMusicTracks(
  files: Iterable<File>,
  isExampleTrack: boolean = false,
) {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        rootPlaylist: {
          tracks: true,
        },
      },
    },
  });

  for (const file of files) {
    // The ownership object defines the user that owns the created coValues
    // We are creating a group for each CoValue in order to be able to share them via Playlist
    const group = Group.create();

    const data = await getAudioFileData(file);

    // We transform the file blob into a FileStream
    // making it a collaborative value that is encrypted, easy
    // to share across devices and users and available offline!
    const fileStream = await MusicTrack.shape.file.createFromBlob(file, group);

    const track = MusicTrack.create(
      {
        file: fileStream,
        duration: data.duration,
        waveform: { data: data.waveform },
        title: file.name,
        isExampleTrack,
      },
      group,
    );

    // We create a new music track and add it to the root playlist
    root.rootPlaylist.tracks.$jazz.push(track);
  }
}

export async function createNewPlaylist(title: string = "New Playlist") {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        playlists: true,
      },
    },
  });

  const playlist = Playlist.create({
    title,
    tracks: [],
  });

  // We associate the new playlist to the
  // user by pushing it into the playlists CoList
  root.playlists.$jazz.push(playlist);

  return playlist;
}

export async function addTrackToPlaylist(
  playlist: Playlist,
  track: MusicTrack,
) {
  const { tracks } = await playlist.$jazz.ensureLoaded({
    resolve: PlaylistWithTracks.resolveQuery,
  });

  const isPartOfThePlaylist = tracks.some((t) => t.$jazz.id === track.$jazz.id);
  if (isPartOfThePlaylist) return;

  track.$jazz.owner.addMember(playlist.$jazz.owner);
  tracks.$jazz.push(track);
}

export async function removeTrackFromPlaylist(
  playlist: Playlist,
  track: MusicTrack,
) {
  const { tracks } = await playlist.$jazz.ensureLoaded({
    resolve: {
      tracks: { $each: true },
    },
  });

  const isPartOfThePlaylist = tracks.some((t) => t.$jazz.id === track.$jazz.id);

  if (!isPartOfThePlaylist) return;

  // We remove the track before removing the access
  // because the removeMember might remove our own access
  tracks.$jazz.remove((t) => t.$jazz.id === track.$jazz.id);

  track.$jazz.owner.removeMember(playlist.$jazz.owner);
}

export async function removeTrackFromAllPlaylists(track: MusicTrack) {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        playlists: {
          $each: {
            $onError: "catch",
          },
        },
      },
    },
  });

  const playlists = root.playlists;

  // @ts-expect-error - https://github.com/microsoft/TypeScript/issues/62621
  for (const playlist of playlists) {
    if (!playlist.$isLoaded) continue;

    removeTrackFromPlaylist(playlist, track);
  }
}

export async function updatePlaylistTitle(playlist: Playlist, title: string) {
  playlist.$jazz.set("title", title);
}

export async function updateMusicTrackTitle(track: MusicTrack, title: string) {
  track.$jazz.set("title", title);
}

export async function updateActivePlaylist(playlist?: Playlist) {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        rootPlaylist: true,
      },
    },
  });

  root.$jazz.set("activePlaylist", playlist ?? root.rootPlaylist);
}

export async function updateActiveTrack(track: MusicTrack) {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {},
    },
  });

  root.$jazz.set("activeTrack", track);
}

export async function onAnonymousAccountDiscarded(
  anonymousAccount: MusicaAccount,
) {
  const { root: anonymousAccountRoot } =
    await anonymousAccount.$jazz.ensureLoaded({
      resolve: {
        root: {
          rootPlaylist: {
            tracks: {
              $each: true,
            },
          },
        },
      },
    });

  const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        rootPlaylist: {
          tracks: true,
        },
      },
    },
  });

  // @ts-expect-error - https://github.com/microsoft/TypeScript/issues/62621
  for (const track of anonymousAccountRoot.rootPlaylist.tracks) {
    if (track.isExampleTrack) continue;

    const trackGroup = track.$jazz.owner;
    trackGroup.addMember(me, "admin");

    me.root.rootPlaylist.tracks.$jazz.push(track);
  }
}

export async function deletePlaylist(playlistId: string) {
  const { root } = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        playlists: true,
      },
    },
  });

  const index = root.playlists.findIndex((p) => p?.$jazz.id === playlistId);
  if (index > -1) {
    root.playlists?.$jazz.splice(index, 1);
  }
}

```

### 5_useMediaPlayer.ts

```ts
import { MusicTrack, Playlist } from "@/1_schema";
import { usePlayMedia } from "@/lib/audio/usePlayMedia";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useRef, useState } from "react";
import { updateActivePlaylist, updateActiveTrack } from "./4_actions";
import { useAudioManager } from "./lib/audio/AudioManager";
import { getNextTrack, getPrevTrack } from "./lib/getters";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

export function useMediaPlayer() {
  const audioManager = useAudioManager();
  const playState = usePlayState();
  const playMedia = usePlayMedia();

  const [loading, setLoading] = useState<string | null>(null);

  const activeTrackId = useAccountSelector({
    select: (me) =>
      me.$isLoaded ? me.root.$jazz.refs.activeTrack?.id : undefined,
  });
  // Reference used to avoid out-of-order track loads
  const lastLoadedTrackId = useRef<string | null>(null);

  async function loadTrack(track: MusicTrack, autoPlay = true) {
    lastLoadedTrackId.current = track.$jazz.id;
    audioManager.unloadCurrentAudio();

    setLoading(track.$jazz.id);
    updateActiveTrack(track);

    const file = await MusicTrack.shape.file.loadAsBlob(
      track.$jazz.refs.file.id,
    );

    if (!file) {
      setLoading(null);
      return;
    }

    // Check if another track has been loaded during
    // the file download
    if (lastLoadedTrackId.current !== track.$jazz.id) {
      return;
    }

    await playMedia(file, autoPlay);

    setLoading(null);
  }

  async function playNextTrack() {
    const track = await getNextTrack();

    if (track.$isLoaded) {
      updateActiveTrack(track);
      await loadTrack(track);
    }
  }

  async function playPrevTrack() {
    const track = await getPrevTrack();

    if (track.$isLoaded) {
      await loadTrack(track);
    }
  }

  async function setActiveTrack(track: MusicTrack, playlist?: Playlist) {
    if (
      activeTrackId === track.$jazz.id &&
      lastLoadedTrackId.current !== null
    ) {
      playState.toggle();
      return;
    }

    updateActivePlaylist(playlist);

    await loadTrack(track);

    if (playState.value === "pause") {
      playState.toggle();
    }
  }

  return {
    activeTrackId,
    setActiveTrack,
    playNextTrack,
    playPrevTrack,
    loading,
    loadTrack,
  };
}

export type MediaPlayer = ReturnType<typeof useMediaPlayer>;

```

### 6_InvitePage.tsx

```tsx
import { useAcceptInvite, useIsAuthenticated } from "jazz-tools/react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MusicaAccount, Playlist } from "./1_schema";

export function InvitePage() {
  const navigate = useNavigate();

  const isAuthenticated = useIsAuthenticated();

  useAcceptInvite({
    invitedObjectSchema: Playlist,
    onAccept: useCallback(
      async (playlistId: string) => {
        const playlist = await Playlist.load(playlistId, {});

        const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
          resolve: {
            root: {
              playlists: {
                $each: {
                  $onError: "catch",
                },
              },
            },
          },
        });

        if (
          playlist &&
          !me.root.playlists.some(
            (item) => playlist.$jazz.id === item?.$jazz.id,
          )
        ) {
          me.root.playlists.$jazz.push(playlist);
        }

        navigate("/playlist/" + playlistId);
      },
      [navigate],
    ),
  });

  return isAuthenticated ? (
    <p>Accepting invite....</p>
  ) : (
    <p>Please sign in to accept the invite.</p>
  );
}

```

### apiKey.ts

```ts
export const apiKey =
  import.meta.env.VITE_JAZZ_API_KEY ?? "music-player-example-jazz@garden.co";

```

### components/AccountProvider.tsx

```tsx
import { MusicaAccount, PlaylistWithTracks } from "@/1_schema.ts";
import { createAccountSubscriptionContext } from "jazz-tools/react-core";

export const { Provider: AccountProvider, useSelector: useAccountSelector } =
  createAccountSubscriptionContext(MusicaAccount, {
    root: {
      rootPlaylist: PlaylistWithTracks.resolveQuery,
      playlists: {
        $each: {
          $onError: "catch",
        },
      },
      activeTrack: { $onError: "catch" },
      activePlaylist: { $onError: "catch" },
    },
    profile: true,
  });

```

### components/AuthButton.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useLogOut, useIsAuthenticated } from "jazz-tools/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "./AuthModal";

export function AuthButton() {
  const [open, setOpen] = useState(false);
  const logOut = useLogOut();
  const navigate = useNavigate();

  const isAuthenticated = useIsAuthenticated();

  function handleSignOut() {
    logOut();
    navigate("/");
  }

  if (isAuthenticated) {
    return (
      <Button variant="ghost" onClick={handleSignOut}>
        Sign out
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Sign up
      </Button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}

```

### components/AuthModal.tsx

```tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePasskeyAuth } from "jazz-tools/react";
import { useState } from "react";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileName = useAccountSelector({
    select: (me) => (me.$isLoaded ? me.profile.name : undefined),
  });

  const auth = usePasskeyAuth({
    appName: "Jazz Music Player",
  });

  const handleViewChange = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        if (profileName) {
          await auth.signUp(profileName);
        }
      } else {
        await auth.logIn();
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        if (error.cause instanceof Error) {
          setError(error.cause.message);
        } else {
          setError(error.message);
        }
      } else {
        setError("Unknown error");
      }
    }
  };

  const shouldShowTransferRootPlaylist = useAccountSelector({
    select: (me) =>
      !isSignUp &&
      me.$isLoaded &&
      me.root.rootPlaylist.tracks.some((track) => !track.isExampleTrack),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isSignUp ? "Create account" : "Welcome back"}
          </DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Sign up to enable network sync and share your playlists with others"
              : "Changes done before logging in will be lost"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          {shouldShowTransferRootPlaylist && (
            <div className="text-sm text-red-500">
              You have tracks in your root playlist that are not example tracks.
              If you log in with a passkey, your playlists will be transferred
              to your logged account.
            </div>
          )}
          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSignUp ? "Sign up with passkey" : "Login with passkey"}
            </Button>
            <div className="text-center text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={handleViewChange}
                className="text-blue-600 hover:underline"
              >
                {isSignUp ? "Login" : "Sign up"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

```

### components/ConfirmDialog.tsx

```tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

### components/CreatePlaylistModal.tsx

```tsx
import { createNewPlaylist } from "@/4_actions";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (playlistId: string) => void;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  onPlaylistCreated,
}: CreatePlaylistModalProps) {
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  function handleTitleChange(evt: React.ChangeEvent<HTMLInputElement>) {
    setPlaylistTitle(evt.target.value);
  }

  async function handleCreate() {
    if (!playlistTitle.trim()) return;

    setIsCreating(true);
    try {
      const playlist = await createNewPlaylist(playlistTitle.trim());
      setPlaylistTitle("");
      onPlaylistCreated(playlist.$jazz.id);
      onClose();
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  }

  function handleCancel() {
    setPlaylistTitle("");
    onClose();
  }

  function handleKeyDown(evt: React.KeyboardEvent) {
    if (evt.key === "Enter") {
      handleCreate();
    } else if (evt.key === "Escape") {
      handleCancel();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Create New Playlist
          </h2>
          <p className="text-sm text-gray-600">Give your new playlist a name</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="playlist-title"
              className="text-sm font-medium text-gray-700"
            >
              Playlist Title
            </Label>
            <Input
              id="playlist-title"
              value={playlistTitle}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter playlist title"
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!playlistTitle.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### components/EditPlaylistModal.tsx

```tsx
import { Playlist } from "@/1_schema";
import { updatePlaylistTitle } from "@/4_actions";
import { useCoState } from "jazz-tools/react";
import { ChangeEvent, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface EditPlaylistModalProps {
  playlistId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPlaylistModal({
  playlistId,
  isOpen,
  onClose,
}: EditPlaylistModalProps) {
  const playlist = useCoState(Playlist, playlistId);
  const [localPlaylistTitle, setLocalPlaylistTitle] = useState("");

  // Reset local title when modal opens or playlist changes
  useEffect(() => {
    if (isOpen && playlist.$isLoaded) {
      setLocalPlaylistTitle(playlist.title);
    }
  }, [isOpen, playlist]);

  function handleTitleChange(evt: ChangeEvent<HTMLInputElement>) {
    setLocalPlaylistTitle(evt.target.value);
  }

  function handleSave() {
    if (playlist.$isLoaded && localPlaylistTitle.trim()) {
      updatePlaylistTitle(playlist, localPlaylistTitle.trim());
      onClose();
    }
  }

  function handleCancel() {
    setLocalPlaylistTitle(playlist.$isLoaded ? playlist.title : "");
    onClose();
  }

  function handleKeyDown(evt: React.KeyboardEvent) {
    if (evt.key === "Enter") {
      handleSave();
    } else if (evt.key === "Escape") {
      handleCancel();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Edit Playlist
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="playlist-title"
              className="text-sm font-medium text-gray-700"
            >
              Playlist Title
            </Label>
            <Input
              id="playlist-title"
              value={localPlaylistTitle}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter playlist title"
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!localPlaylistTitle.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### components/FileUploadButton.tsx

```tsx
import { ReactNode } from "react";
import { Button } from "./ui/button";

export function FileUploadButton(props: {
  onFileLoad: (files: FileList) => Promise<void>;
  children: ReactNode;
}) {
  async function handleFileLoad(evt: React.ChangeEvent<HTMLInputElement>) {
    if (!evt.target.files) return;

    await props.onFileLoad(evt.target.files);

    evt.target.value = "";
  }

  return (
    <Button>
      <label className="flex items-center  cursor-pointer p-2">
        <input type="file" onChange={handleFileLoad} multiple hidden />
        {props.children}
      </label>
    </Button>
  );
}

```

### components/LocalOnlyTag.tsx

```tsx
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsAuthenticated } from "jazz-tools/react";
import { Info } from "lucide-react";

export function LocalOnlyTag() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 cursor-help">
            <Badge variant="default" className="h-5 text-xs font-normal">
              Local only
            </Badge>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p>
            Sign up to enable network sync and share your playlists with others
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

```

### components/LogoutButton.tsx

```tsx
import { useLogOut } from "jazz-tools/react";
import { Button } from "./ui/button";

export function LogoutButton() {
  const logOut = useLogOut();

  return <Button onClick={logOut}>Logout</Button>;
}

```

### components/Member.tsx

```tsx
import { useCoState } from "jazz-tools/react";
import { MusicaAccount } from "@/1_schema";
import { Image } from "jazz-tools/react";

interface MemberProps {
  accountId: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function Member({
  accountId,
  size = "md",
  showTooltip = true,
  className = "",
}: MemberProps) {
  const account = useCoState(MusicaAccount, accountId, {
    resolve: { profile: true },
  });

  if (!account.$isLoaded) {
    return (
      <div
        className={`rounded-full bg-gray-200 border-2 border-white flex items-center justify-center ${getSizeClasses(size)} ${className}`}
      >
        <span className="text-gray-500 text-xs">👤</span>
      </div>
    );
  }

  const avatar = account.profile.avatar;
  const name = account.profile.name || "Unknown User";

  return (
    <div
      className={`rounded-full border-2 border-white overflow-hidden ${getSizeClasses(size)} ${className}`}
      title={showTooltip ? name : undefined}
    >
      {avatar ? (
        <Image
          imageId={avatar.$jazz.id}
          width={getSizePx(size)}
          height={getSizePx(size)}
          alt={`${name}'s avatar`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

function getSizeClasses(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "w-6 h-6";
    case "md":
      return "w-8 h-8";
    case "lg":
      return "w-10 h-10";
    default:
      return "w-8 h-8";
  }
}

function getSizePx(size: "sm" | "md" | "lg"): number {
  switch (size) {
    case "sm":
      return 24;
    case "md":
      return 32;
    case "lg":
      return 40;
    default:
      return 32;
  }
}

```

### components/MemberAccessModal.tsx

```tsx
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Account, Group } from "jazz-tools";
import { useCoState, createInviteLink } from "jazz-tools/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  User,
  Crown,
  Edit,
  Eye,
  Trash2,
  Users,
  UserPlus,
  Link,
} from "lucide-react";
import { MusicaAccount, Playlist } from "@/1_schema";
import { Member } from "./Member";

interface MemberAccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

export function MemberAccessModal(props: MemberAccessModalProps) {
  const group = useCoState(Group, props.playlist.$jazz.owner.$jazz.id);
  const [selectedRole, setSelectedRole] = useState<
    "reader" | "writer" | "manager"
  >("reader");
  const { toast } = useToast();

  if (!group.$isLoaded) return null;

  // Get all members from the group
  const members = group.members.map((m) => m.account);
  const currentUser = MusicaAccount.getMe();
  const isManager = group.myRole() === "admin" || group.myRole() === "manager";

  const handleRoleChange = async (
    member: Account,
    newRole: "reader" | "writer" | "manager",
  ) => {
    if (!isManager) return;

    group.addMember(member, newRole);
  };

  const handleRemoveMember = async (member: Account) => {
    if (!isManager) return;

    group.removeMember(member);
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "writer":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "reader":
        return <Eye className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "manager":
        return "Manager";
      case "writer":
        return "Writer";
      case "reader":
        return "Reader";
      default:
        return "No Access";
    }
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "manager":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "writer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "reader":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canModifyMember = (member: Account) => {
    return (
      isManager &&
      (member.$jazz.id === currentUser?.$jazz.id ||
        !member.canAdmin(props.playlist))
    );
  };

  const handleGetInviteLink = async () => {
    if (!isManager) return;

    const inviteLink = createInviteLink(props.playlist, selectedRole);
    await navigator.clipboard.writeText(inviteLink);

    toast({
      title: "Invite link copied",
      description: `Invite link for ${selectedRole} role copied to clipboard.`,
    });
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Playlist Members
          </DialogTitle>
          <DialogDescription>
            Manage access levels and remove members from the playlist group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No members found in this playlist.
            </div>
          ) : (
            <section>
              {members.map((member) => {
                const memberId = member.$jazz.id;
                const currentRole = group.getRoleOf(memberId);
                const isCurrentUser = memberId === currentUser?.$jazz.id;
                const canModify = canModifyMember(member);

                return (
                  <div key={memberId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <Member
                          accountId={memberId}
                          size="sm"
                          showTooltip={true}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {isCurrentUser
                              ? "You"
                              : member.profile.$isLoaded
                                ? member.profile.name
                                : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getRoleIcon(currentRole)}
                            <Badge
                              variant="outline"
                              className={getRoleColor(currentRole)}
                            >
                              {getRoleLabel(currentRole)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {canModify && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Grant reader access"
                              onClick={() => handleRoleChange(member, "reader")}
                              disabled={currentRole === "reader"}
                              className="px-2 py-1 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Reader
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label="Grant writer access"
                              onClick={() => handleRoleChange(member, "writer")}
                              disabled={currentRole === "writer"}
                              className="px-2 py-1 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Writer
                            </Button>
                            {group.myRole() === "admin" && (
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label="Grant manager access"
                                onClick={() =>
                                  handleRoleChange(member, "manager")
                                }
                                disabled={currentRole === "manager"}
                                className="px-2 py-1 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Manager
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label="Remove member"
                            onClick={() => handleRemoveMember(member)}
                            className="px-2 py-1 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {isManager && (
            <section className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Invite new members
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate an invite link to add new members to this playlist.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Button
                        variant={
                          selectedRole === "reader" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedRole("reader")}
                        className="px-3 py-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Reader
                      </Button>
                      <Button
                        variant={
                          selectedRole === "writer" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedRole("writer")}
                        className="px-3 py-2"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Writer
                      </Button>
                      {group.myRole() === "admin" && (
                        <Button
                          variant={
                            selectedRole === "manager" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedRole("manager")}
                          className="px-3 py-2"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Manager
                        </Button>
                      )}
                    </div>
                    <Button onClick={handleGetInviteLink} className="gap-2">
                      <Link className="w-4 h-4" />
                      Get Invite Link
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

### components/MusicTrackRow.tsx

```tsx
import {
  MusicTrack,
  Playlist,
  PlaylistWithTracks,
  MusicaAccountWithPlaylists,
} from "@/1_schema";
import {
  addTrackToPlaylist,
  removeTrackFromAllPlaylists,
  removeTrackFromPlaylist,
} from "@/4_actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAccount, useCoState } from "jazz-tools/react";
import { MoreHorizontal, Pause, Play } from "lucide-react";
import { Fragment, useCallback, useState } from "react";
import { EditTrackDialog } from "./RenameTrackDialog";
import { Waveform } from "./Waveform";
import { Button } from "./ui/button";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

function isPartOfThePlaylist(trackId: string, playlist: PlaylistWithTracks) {
  return Array.from(playlist.tracks.$jazz.refs).some((t) => t.id === trackId);
}

export function MusicTrackRow({
  trackId,
  isPlaying,
  onClick,
  index,
}: {
  trackId: string;
  isPlaying: boolean;
  onClick: (track: MusicTrack) => void;
  index: number;
}) {
  const track = useCoState(MusicTrack, trackId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const playlists = useAccount(MusicaAccountWithPlaylists, {
    select: (account) =>
      account.$isLoaded && account.root.playlists.$isLoaded
        ? account.root.playlists
        : undefined,
  });

  const isActiveTrack = useAccountSelector({
    select: (me) => me.$isLoaded && me.root.activeTrack?.$jazz.id === trackId,
  });

  const canEditTrack = useAccountSelector({
    select: (me) => me.$isLoaded && track.$isLoaded && me.canWrite(track),
  });

  function handleTrackClick() {
    if (!track.$isLoaded) return;
    onClick(track);
  }

  function handleAddToPlaylist(playlist: Playlist) {
    if (!track.$isLoaded) return;
    addTrackToPlaylist(playlist, track);
  }

  function handleRemoveFromPlaylist(playlist: Playlist) {
    if (!track.$isLoaded) return;
    removeTrackFromPlaylist(playlist, track);
  }

  function deleteTrack() {
    if (!track.$isLoaded) return;
    removeTrackFromAllPlaylists(track);
  }

  function handleEdit() {
    setIsEditDialogOpen(true);
  }

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropdownOpen(true);
  }, []);

  const showWaveform = isHovered || isActiveTrack;
  const trackTitle = track.$isLoaded ? track.title : "";

  return (
    <li
      className={cn(
        "flex gap-1 hover:bg-slate-200 group py-2 cursor-pointer rounded-lg",
        isActiveTrack && "bg-slate-200",
      )}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <button
        className={cn(
          "flex items-center justify-center bg-transparent w-8 h-8 transition-opacity cursor-pointer",
          // Show play button on hover or when active, hide otherwise
          "md:opacity-0 opacity-50 group-hover:opacity-100",
          isActiveTrack && "md:opacity-100 opacity-100",
        )}
        onClick={handleTrackClick}
        aria-label={`${isPlaying ? "Pause" : "Play"} ${trackTitle}`}
      >
        {isPlaying ? (
          <Pause height={16} width={16} fill="currentColor" />
        ) : (
          <Play height={16} width={16} fill="currentColor" />
        )}
      </button>
      {/* Show track index when play button is hidden - hidden on mobile */}
      <div
        className={cn(
          "hidden md:flex items-center justify-center w-8 h-8 text-sm text-gray-500 font-mono transition-opacity",
        )}
      >
        {index + 1}
      </div>
      <button
        onContextMenu={handleContextMenu}
        onClick={handleTrackClick}
        className="flex items-center overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer flex-1 min-w-0"
      >
        {trackTitle}
      </button>

      {/* Waveform that appears on hover */}
      {track.$isLoaded && showWaveform && (
        <div className="flex-1 min-w-0 px-2 items-center hidden md:flex">
          <Waveform
            track={track}
            height={20}
            className="opacity-70 w-full"
            showProgress={isActiveTrack}
          />
        </div>
      )}

      {canEditTrack && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Open ${trackTitle} menu`}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
              {playlists
                ?.filter((playlist) => playlist.$isLoaded)
                .map((playlist, playlistIndex) => (
                  <Fragment key={playlistIndex}>
                    {isPartOfThePlaylist(trackId, playlist) ? (
                      <DropdownMenuItem
                        key={`remove-${playlistIndex}`}
                        onSelect={() => handleRemoveFromPlaylist(playlist)}
                      >
                        Remove from {playlist.title}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        key={`add-${playlistIndex}`}
                        onSelect={() => handleAddToPlaylist(playlist)}
                      >
                        Add to {playlist.title}
                      </DropdownMenuItem>
                    )}
                  </Fragment>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {track.$isLoaded && isEditDialogOpen && (
        <EditTrackDialog
          track={track}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onDelete={deleteTrack}
        />
      )}
    </li>
  );
}

```

### components/MusicTrackTitleInput.tsx

```tsx
import { MusicTrack } from "@/1_schema";
import { updateMusicTrackTitle } from "@/4_actions";
import { useCoState } from "jazz-tools/react";
import { ChangeEvent, useState } from "react";

export function MusicTrackTitleInput({
  trackId,
}: {
  trackId: string | undefined;
}) {
  const track = useCoState(MusicTrack, trackId);
  const [isEditing, setIsEditing] = useState(false);
  const [localTrackTitle, setLocalTrackTitle] = useState("");

  const trackTitle = track.$isLoaded ? track.title : "";

  function handleTitleChange(evt: ChangeEvent<HTMLInputElement>) {
    setLocalTrackTitle(evt.target.value);
  }

  function handleFoucsIn() {
    setIsEditing(true);
    setLocalTrackTitle(trackTitle);
  }

  function handleFocusOut() {
    setIsEditing(false);
    setLocalTrackTitle("");
    track.$isLoaded && updateMusicTrackTitle(track, localTrackTitle);
  }

  const inputValue = isEditing ? localTrackTitle : trackTitle;

  return (
    <div
      className="relative grow max-w-64"
      onClick={(evt) => evt.stopPropagation()}
    >
      <input
        className="absolute w-full h-full left-0 bg-transparent px-1"
        value={inputValue}
        onChange={handleTitleChange}
        spellCheck="false"
        onFocus={handleFoucsIn}
        onBlur={handleFocusOut}
        aria-label={`Edit track title: ${trackTitle}`}
      />
      <span className="opacity-0 px-1 w-fit pointer-events-none whitespace-pre">
        {inputValue}
      </span>
    </div>
  );
}

```

### components/PlayerControls.tsx

```tsx
import { MusicTrack } from "@/1_schema";
import { MediaPlayer } from "@/5_useMediaPlayer";
import { useMediaEndListener } from "@/lib/audio/useMediaEndListener";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useKeyboardListener } from "@/lib/useKeyboardListener";
import { useCoState } from "jazz-tools/react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import WaveformCanvas from "./WaveformCanvas";
import { Button } from "./ui/button";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

export function PlayerControls({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
  const playState = usePlayState();
  const isPlaying = playState.value === "play";

  const activePlaylistTitle = useAccountSelector({
    select: (me) =>
      me.$isLoaded && me.root.activePlaylist?.$isLoaded
        ? (me.root.activePlaylist.title ?? "All tracks")
        : "All tracks",
  });

  const activeTrack = useCoState(MusicTrack, mediaPlayer.activeTrackId);

  if (!activeTrack.$isLoaded) return null;

  const activeTrackTitle = activeTrack.title;

  return (
    <footer className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-4 p-2 sm:p-4 gap-4 sm:gap-4 bg-white border-t border-gray-200 absolute bottom-0 left-0 right-0 w-full z-50">
      {/* Player Controls - Always on top */}
      <div className="flex justify-center items-center space-x-1 sm:space-x-2 flex-shrink-0 w-full sm:w-auto order-1 sm:order-none">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={mediaPlayer.playPrevTrack}
            aria-label="Previous track"
          >
            <SkipBack className="h-5 w-5" fill="currentColor" />
          </Button>
          <Button
            size="icon"
            onClick={playState.toggle}
            className="bg-blue-600 text-white hover:bg-blue-700"
            aria-label={isPlaying ? "Pause active track" : "Play active track"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5" fill="currentColor" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={mediaPlayer.playNextTrack}
            aria-label="Next track"
          >
            <SkipForward className="h-5 w-5" fill="currentColor" />
          </Button>
        </div>
      </div>

      {/* Waveform - Below controls on mobile, between controls and info on desktop */}
      <WaveformCanvas
        className="order-1 sm:order-none"
        track={activeTrack}
        height={50}
      />

      {/* Track Info - Below waveform on mobile, on the right on desktop */}
      <div className="flex flex-col gap-1 min-w-fit sm:flex-shrink-0 text-center w-full sm:text-right items-center sm:items-end sm:w-auto order-0 sm:order-none">
        <h4 className="font-medium text-blue-800 text-base sm:text-base truncate max-w-80 sm:max-w-80">
          {activeTrackTitle}
        </h4>
        <p className="hidden sm:block text-xs sm:text-sm text-gray-600 truncate sm:max-w-80">
          {activePlaylistTitle || "All tracks"}
        </p>
      </div>
    </footer>
  );
}

export function KeyboardListener({
  mediaPlayer,
}: {
  mediaPlayer: MediaPlayer;
}) {
  const playState = usePlayState();

  useMediaEndListener(mediaPlayer.playNextTrack);
  useKeyboardListener("Space", () => {
    if (document.activeElement !== document.body) return;

    playState.toggle();
  });

  return null;
}

```

### components/PlaylistMembers.tsx

```tsx
import { Member } from "./Member";

interface PlaylistMembersProps {
  memberIds: string[];
  size?: "sm" | "md" | "lg";
  onClick: () => void;
  className?: string;
}

export function PlaylistMembers({
  memberIds,
  size = "md",
  className = "",
  onClick,
}: PlaylistMembersProps) {
  if (!memberIds || memberIds.length === 0) return null;
  return (
    <>
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 hover:scale-105 transition-transform duration-200 cursor-pointer ${className}`}
        title="Click to manage playlist members"
      >
        <div className="flex -space-x-2">
          {memberIds.map((memberId) => (
            <Member
              key={memberId}
              accountId={memberId}
              size={size}
              showTooltip={true}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600 ml-2">
          ({memberIds.length} member{memberIds.length !== 1 ? "s" : ""})
        </span>
      </button>
    </>
  );
}

```

### components/PlaylistTitleInput.tsx

```tsx
import { Playlist } from "@/1_schema";
import { updatePlaylistTitle } from "@/4_actions";
import { cn } from "@/lib/utils";
import { useCoState } from "jazz-tools/react";
import { ChangeEvent, useState } from "react";

export function PlaylistTitleInput({
  playlistId,
  className,
}: {
  playlistId: string | undefined;
  className?: string;
}) {
  const playlist = useCoState(Playlist, playlistId);
  const [isEditing, setIsEditing] = useState(false);
  const [localPlaylistTitle, setLocalPlaylistTitle] = useState("");

  function handleTitleChange(evt: ChangeEvent<HTMLInputElement>) {
    setLocalPlaylistTitle(evt.target.value);
  }

  const playlistTitle = playlist.$isLoaded ? playlist.title : "";

  function handleFoucsIn() {
    setIsEditing(true);
    setLocalPlaylistTitle(playlistTitle);
  }

  function handleFocusOut() {
    setIsEditing(false);
    setLocalPlaylistTitle("");
    playlist.$isLoaded && updatePlaylistTitle(playlist, localPlaylistTitle);
  }

  const inputValue = isEditing ? localPlaylistTitle : playlistTitle;

  return (
    <input
      value={inputValue}
      onChange={handleTitleChange}
      className={cn(
        "text-2xl font-bold text-blue-800 bg-transparent",
        className,
      )}
      onFocus={handleFoucsIn}
      onBlur={handleFocusOut}
      aria-label={`Playlist title`}
    />
  );
}

```

### components/ProfileForm.tsx

```tsx
import React, { useState, useRef } from "react";
import { Image } from "jazz-tools/react";
import { createImage } from "jazz-tools/media";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Group } from "jazz-tools";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

interface ProfileFormProps {
  onSubmit?: (data: { username: string; avatar?: any }) => void;
  submitButtonText?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  initialUsername?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  className?: string;
}

export function ProfileForm({
  onSubmit,
  submitButtonText = "Save Changes",
  showHeader = false,
  headerTitle = "Profile Settings",
  headerDescription = "Update your profile information",
  initialUsername = "",
  onCancel,
  showCancelButton = false,
  cancelButtonText = "Cancel",
  className = "",
}: ProfileFormProps) {
  const profile = useAccountSelector({
    select: (me) => (me.$isLoaded ? me.profile : undefined),
  });

  const [username, setUsername] = useState(
    initialUsername || profile?.name || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create image using the Image API from jazz-tools/media
      const image = await createImage(file, {
        owner: Group.create().makePublic(),
        maxSize: 256, // Good size for avatars
        placeholder: "blur",
        progressive: true,
      });

      // Update the profile with the new avatar
      profile.$jazz.set("avatar", image);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim()) return;

    // Update username
    profile.$jazz.set("name", username.trim());

    // Call custom onSubmit if provided
    if (onSubmit) {
      onSubmit({ username: username.trim(), avatar: profile.avatar });
    }
  };

  const currentAvatar = profile.avatar;
  const canSubmit = username.trim();

  return (
    <div className={className}>
      {showHeader && (
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {headerTitle}
          </h1>
          <p className="text-gray-600">{headerDescription}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className="space-y-3">
          <Label
            htmlFor="avatar"
            className="text-sm font-medium text-gray-700 sr-only"
          >
            Profile Picture
          </Label>

          <div className="flex flex-col items-center space-y-3">
            {/* Current Avatar Display */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {currentAvatar ? (
                  <Image
                    imageId={currentAvatar.$jazz.id}
                    width={96}
                    height={96}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">👤</span>
                  </div>
                )}
              </div>

              {/* Upload Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                title="Change avatar"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-sm">📷</span>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploading}
            />

            <p className="text-xs text-gray-500 text-center">
              Click the camera icon to upload a profile picture
            </p>
          </div>
        </div>

        <Separator />

        {/* Username Section */}
        <div className="space-y-3">
          <Label
            htmlFor="username"
            className="text-sm font-medium text-gray-700"
          >
            Username
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
            maxLength={30}
          />
          <p className="text-xs text-gray-500">
            This will be displayed to other users
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              size="lg"
            >
              {cancelButtonText}
            </Button>
          )}
          <Button
            type="submit"
            disabled={!canSubmit}
            className={`${showCancelButton ? "flex-1" : "w-full"} bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            size="lg"
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
}

```

### components/RenameTrackDialog.tsx

```tsx
import { MusicTrack } from "@/1_schema";
import { updateMusicTrackTitle } from "@/4_actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface EditTrackDialogProps {
  track: MusicTrack;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function EditTrackDialog({
  track,
  isOpen,
  onOpenChange,
  onDelete,
}: EditTrackDialogProps) {
  const [newTitle, setNewTitle] = useState(track.title);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  function handleSave() {
    if (track && newTitle.trim()) {
      updateMusicTrackTitle(track, newTitle.trim());
      onOpenChange(false);
    }
  }

  function handleCancel() {
    setNewTitle(track?.title || "");
    onOpenChange(false);
  }

  function handleDeleteClick() {
    setIsDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    onDelete();
    onOpenChange(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Track</DialogTitle>
          <DialogDescription>Edit "{track?.title}".</DialogDescription>
        </DialogHeader>
        <form className="py-4" onSubmit={handleSave}>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter track name..."
            autoFocus
          />
        </form>
        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            className="mr-auto"
          >
            Delete Track
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!newTitle.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Track"
        description={`Are you sure you want to delete "${track.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </Dialog>
  );
}

```

### components/SidePanel.tsx

```tsx
import { MusicaAccount } from "@/1_schema";
import { deletePlaylist } from "@/4_actions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAccount } from "jazz-tools/react";
import { Home, Music, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { AuthButton } from "./AuthButton";
import { CreatePlaylistModal } from "./CreatePlaylistModal";

export function SidePanel() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const playlists = useAccount(MusicaAccount, {
    resolve: { root: { playlists: { $each: { $onError: "catch" } } } },
    select: (me) => (me.$isLoaded ? me.root.playlists : undefined),
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  function handleAllTracksClick() {
    navigate(`/`);
  }

  function handlePlaylistClick(playlistId: string) {
    navigate(`/playlist/${playlistId}`);
  }

  async function handleDeletePlaylist(playlistId: string) {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(playlistId);
      navigate(`/`);
    }
  }

  function handleCreatePlaylistClick() {
    setIsCreateModalOpen(true);
  }

  function handlePlaylistCreated(playlistId: string) {
    navigate(`/playlist/${playlistId}`);
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 18V5l12-2v13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 15H3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM18 13h-3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Music Player</span>
              </div>
              <AuthButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleAllTracksClick}>
                    <Home className="size-4" />
                    <span>Go to all tracks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Playlists</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleCreatePlaylistClick}>
                    <Plus className="size-4" />
                    <span>Add a new playlist</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {playlists?.map(
                  (playlist) =>
                    playlist.$isLoaded && (
                      <SidebarMenuItem key={playlist.$jazz.id}>
                        <SidebarMenuButton
                          onClick={() => handlePlaylistClick(playlist.$jazz.id)}
                          isActive={playlist.$jazz.id === playlistId}
                        >
                          <div className="flex items-center gap-2">
                            <Music className="size-4" />
                            <span>{playlist.title}</span>
                          </div>
                        </SidebarMenuButton>
                        {playlist.$jazz.id === playlistId && (
                          <SidebarMenuAction
                            onClick={() =>
                              handleDeletePlaylist(playlist.$jazz.id)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">
                              Delete {playlist.title}
                            </span>
                          </SidebarMenuAction>
                        )}
                      </SidebarMenuItem>
                    ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  );
}

```

### components/Waveform.tsx

```tsx
import { MusicTrack, MusicTrackWaveform } from "@/1_schema";
import { usePlayerCurrentTime } from "@/lib/audio/usePlayerCurrentTime";
import { cn } from "@/lib/utils";
import { useCoState } from "jazz-tools/react";

export function Waveform(props: {
  track: MusicTrack;
  height: number;
  className?: string;
  showProgress?: boolean;
}) {
  const { track, height } = props;
  const waveform = useCoState(
    MusicTrackWaveform,
    track.$jazz.refs.waveform?.id,
  );
  const currentTime = usePlayerCurrentTime();

  if (!waveform.$isLoaded) {
    return (
      <div
        style={{
          height,
        }}
      />
    );
  }

  const duration = track.duration;
  const waveformData = waveform.data;
  const barCount = waveformData.length;
  const activeBar = props.showProgress
    ? Math.ceil(barCount * (currentTime.value / duration))
    : -1;

  return (
    <div
      className={cn("flex justify-center items-end w-full", props.className)}
      style={{
        height,
      }}
    >
      {waveformData.map((value, i) => (
        <button
          type="button"
          key={i}
          className={cn(
            "w-1 transition-colors rounded-none rounded-t-lg min-h-1",
            activeBar >= i ? "bg-gray-800" : "bg-gray-400",
            "focus-visible:outline-black focus:outline-hidden",
          )}
          style={{
            height: height * value,
          }}
          aria-label={`Seek to ${(i / barCount) * duration} seconds`}
        />
      ))}
    </div>
  );
}

```

### components/WaveformCanvas.tsx

```tsx
"use client";

import { MusicTrack, MusicTrackWaveform } from "@/1_schema";
import { AudioManager, useAudioManager } from "@/lib/audio/AudioManager";
import {
  getPlayerCurrentTime,
  setPlayerCurrentTime,
  subscribeToPlayerCurrentTime,
  usePlayerCurrentTime,
} from "@/lib/audio/usePlayerCurrentTime";
import { cn } from "@/lib/utils";
import type React from "react";

import { useEffect, useRef } from "react";

type Props = {
  track: MusicTrack;
  height?: number;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  className?: string;
};

const DEFAULT_HEIGHT = 96;

// Downsample PCM into N peaks (abs max in window)
function buildPeaks(channelData: number[], samples: number): Float32Array {
  const length = channelData.length;
  if (channelData.length < samples) {
    // Create a peaks array that interpolates the channelData
    const interpolatedPeaks = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const index = Math.floor(i * (length / samples));
      interpolatedPeaks[i] = channelData[index];
    }
    return interpolatedPeaks;
  }

  const blockSize = Math.floor(length / samples);
  const peaks = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let end = start + blockSize;
    if (end > length) end = length;
    let max = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(channelData[j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}

type DrawWaveformCanvasProps = {
  canvas: HTMLCanvasElement;
  waveformData: number[] | undefined;
  duration: number;
  currentTime: number;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  isAnimating: boolean;
  animationProgress: number;
  progress: number;
};

function drawWaveform(props: DrawWaveformCanvasProps) {
  const {
    canvas,
    waveformData,
    isAnimating,
    animationProgress,
    barColor = "hsl(215, 16%, 47%)",
    progressColor = "hsl(142, 71%, 45%)",
    backgroundColor = "transparent",
    progress,
  } = props;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  if (!waveformData || !waveformData.length) {
    // Draw placeholder line
    ctx.strokeStyle = "hsl(215, 20%, 65%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cssHeight / 2);
    ctx.lineTo(cssWidth, cssHeight / 2);
    ctx.stroke();
    return;
  }

  const midY = cssHeight / 2;
  const barWidth = 2; // px
  const gap = 1;
  const totalBars = Math.floor(cssWidth / (barWidth + gap));
  const ds = buildPeaks(waveformData, totalBars);

  const draw = (color: string, untilBar: number, start = 0) => {
    ctx.fillStyle = color;
    for (let i = start; i < untilBar; i++) {
      const v = ds[i] || 0;
      const h = Math.max(2, v * (cssHeight - 8)); // margin
      const x = i * (barWidth + gap);

      // Apply staggered animation
      if (isAnimating) {
        const barProgress = Math.max(0, Math.min(1, animationProgress / 0.2));
        const animatedHeight = h * barProgress;

        ctx.globalAlpha = barProgress;
        ctx.fillRect(x, midY - animatedHeight / 2, barWidth, animatedHeight);
      } else {
        ctx.fillRect(x, midY - h / 2, barWidth, h);
      }
    }
  };

  // Progress overlay
  const progressBars = Math.floor(
    totalBars * Math.max(0, Math.min(1, progress || 0)),
  );
  draw(progressColor, progressBars);
  // Base waveform
  draw(barColor, totalBars, progressBars);
}

type WaveformCanvasProps = {
  audioManager: AudioManager;
  canvas: HTMLCanvasElement;
  waveformId: string;
  duration: number;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
};

async function renderWaveform(props: WaveformCanvasProps) {
  const { audioManager, canvas, waveformId, duration } = props;

  let mounted = true;
  let currentTime = getPlayerCurrentTime(audioManager);
  let waveformData: undefined | number[] = undefined;
  let isAnimating = true;
  const startTime = performance.now();
  let animationProgress = 0;
  const animationDuration = 800;

  function draw() {
    const progress = currentTime / duration;

    drawWaveform({
      canvas,
      waveformData,
      duration,
      currentTime,
      isAnimating,
      animationProgress,
      progress,
    });
  }

  const animate = (currentTime: number) => {
    if (!mounted) return;

    const elapsed = currentTime - startTime;
    animationProgress = Math.min(elapsed / animationDuration, 1);

    if (animationProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }

    draw();
  };

  requestAnimationFrame(animate);

  const unsubscribeFromCurrentTime = subscribeToPlayerCurrentTime(
    audioManager,
    (time) => {
      currentTime = time;
      draw();
    },
  );

  const unsubscribeFromWaveform = MusicTrackWaveform.subscribe(
    waveformId,
    {},
    (newResult) => {
      waveformData = newResult.data;
      draw();
    },
  );

  return () => {
    mounted = false;
    unsubscribeFromCurrentTime();
    unsubscribeFromWaveform();
  };
}

export default function WaveformCanvas({
  track,
  height = DEFAULT_HEIGHT,
  barColor, // muted-foreground-ish
  progressColor, // green
  backgroundColor,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioManager = useAudioManager();

  const duration = track.duration;
  const waveformId = track.$jazz.refs.waveform?.id;

  // Animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!waveformId) return;

    renderWaveform({
      audioManager,
      canvas,
      waveformId,
      duration,
      barColor,
      progressColor,
      backgroundColor,
    });
  }, [audioManager, canvasRef, waveformId, duration]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(1, ratio)) * duration;
    setPlayerCurrentTime(audioManager, time);
  };

  const currentTime = usePlayerCurrentTime();
  const progress = currentTime.value / duration;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="w-full rounded-md bg-background"
        style={{ height }}
        role="slider"
        aria-label="Waveform scrubber"
        aria-valuenow={Math.round((progress || 0) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-md cursor-pointer"
          onPointerDown={onPointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) onPointer(e);
          }}
        />
      </div>
    </div>
  );
}

```

### components/WelcomeScreen.tsx

```tsx
import { usePasskeyAuth } from "jazz-tools/react";
import { ProfileForm } from "./ProfileForm";
import { Button } from "./ui/button";
import { useAccountSelector } from "@/components/AccountProvider.tsx";

export function WelcomeScreen() {
  const auth = usePasskeyAuth({
    appName: "Jazz Music Player",
  });

  const { handleCompleteSetup } = useAccountSelector({
    select: (me) =>
      me.$isLoaded
        ? {
            id: me.root.$jazz.id,
            handleCompleteSetup: () => {
              me.root.$jazz.set("accountSetupCompleted", true);
            },
          }
        : { id: null, handleCompleteSetup: null },
    equalityFn: (a, b) => a.id === b.id,
  });

  const initialUsername = useAccountSelector({
    select: (me) => (me.$isLoaded ? me.profile.name : undefined),
  });

  if (!handleCompleteSetup) return null;

  const handleLogin = () => {
    auth.logIn();
  };

  return (
    <div className="w-full lg:w-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
        {/* Form Panel */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <ProfileForm
            onSubmit={handleCompleteSetup}
            submitButtonText="Continue"
            showHeader={true}
            headerTitle="Welcome to Music Player! 🎵"
            headerDescription="Let's set up your profile to get started"
            initialUsername={initialUsername}
          />
        </div>
        <div className="lg:hidden pt-4 flex justify-end items-center w-full gap-2">
          <div className="text-sm font-semibold text-gray-600">
            Already a user?
          </div>
          <Button onClick={handleLogin} size="sm">
            Login
          </Button>
        </div>

        {/* Title Section - Hidden on mobile, shown on right side for larger screens */}
        <div className="hidden lg:flex flex-col justify-center items-start max-w-md">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Your Music at your fingertips.
            </h1>

            <div className="space-y-4">
              <p className="text-xl lg:text-2xl text-gray-700 font-medium">
                Offline, Collaborative, Fast
              </p>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 font-medium">
                  Powered by
                </span>
                <a
                  href="https://jazz.tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-blue-600 hover:underline"
                >
                  Jazz
                </a>
              </div>

              {/* Login Button */}
              <div className="pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Already a user?
                </p>
                <Button
                  onClick={handleLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### components/ui/badge.tsx

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

```

### components/ui/button.tsx

```tsx
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

```

### components/ui/dialog.tsx

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

```

### components/ui/dropdown-menu.tsx

```tsx
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

```

### components/ui/input.tsx

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

```

### components/ui/label.tsx

```tsx
import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

```

### components/ui/separator.tsx

```tsx
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };

```

### components/ui/sheet.tsx

```tsx
"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

```

### components/ui/sidebar.tsx

```tsx
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      ],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          )}
        />
        <div
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-hidden ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

```

### components/ui/skeleton.tsx

```tsx
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

```

### components/ui/toast.tsx

```tsx
import * as ToastPrimitives from "@radix-ui/react-toast";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 hover:group-[.destructive]:border-destructive/30 hover:group-[.destructive]:bg-destructive hover:group-[.destructive]:text-destructive-foreground focus:group-[.destructive]:ring-destructive",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-hidden focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 hover:group-[.destructive]:text-red-50 focus:group-[.destructive]:ring-red-400 focus:group-[.destructive]:ring-offset-red-600",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

```

### components/ui/toaster.tsx

```tsx
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

```

### components/ui/tooltip.tsx

```tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

```

### hooks/use-mobile.tsx

```tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

```

### hooks/use-toast.ts

```ts
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

```

### index.css

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

html {
  overflow: hidden;
  position: relative;
  background-color: hsl(0 0% 99%);
}

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(20 14.3% 4.1%);

  --card: hsl(0 0% 100%);
  --card-foreground: hsl(20 14.3% 4.1%);

  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(20 14.3% 4.1%);

  --primary: hsl(24 9.8% 10%);
  --primary-foreground: hsl(60 9.1% 97.8%);

  --secondary: hsl(60 4.8% 95.9%);
  --secondary-foreground: hsl(24 9.8% 10%);

  --muted: hsl(60 4.8% 95.9%);
  --muted-foreground: hsl(25 5.3% 44.7%);

  --accent: hsl(60 4.8% 95.9%);
  --accent-foreground: hsl(24 9.8% 10%);

  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(60 9.1% 97.8%);

  --border: hsl(20 5.9% 90%);
  --input: hsl(20 5.9% 90%);
  --ring: hsl(20 14.3% 4.1%);

  --radius: 0.5rem;

  --sidebar-background: hsl(0 0% 98%);
  --sidebar-foreground: hsl(240 5.3% 26.1%);
  --sidebar-primary: hsl(240 5.9% 10%);
  --sidebar-primary-foreground: hsl(0 0% 98%);
  --sidebar-accent: hsl(240 4.8% 95.9%);
  --sidebar-accent-foreground: hsl(240 5.9% 10%);
  --sidebar-border: hsl(220 13% 91%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);
}

.dark {
  --background: hsl(20 14.3% 4.1%);
  --foreground: hsl(60 9.1% 97.8%);

  --card: hsl(20 14.3% 4.1%);
  --card-foreground: hsl(60 9.1% 97.8%);

  --popover: hsl(20 14.3% 4.1%);
  --popover-foreground: hsl(60 9.1% 97.8%);

  --primary: hsl(60 9.1% 97.8%);
  --primary-foreground: hsl(24 9.8% 10%);

  --secondary: hsl(12 6.5% 15.1%);
  --secondary-foreground: hsl(60 9.1% 97.8%);

  --muted: hsl(12 6.5% 15.1%);
  --muted-foreground: hsl(24 5.4% 63.9%);

  --accent: hsl(12 6.5% 15.1%);
  --accent-foreground: hsl(60 9.1% 97.8%);

  --destructive: hsl(0 62.8% 30.6%);
  --destructive-foreground: hsl(60 9.1% 97.8%);

  --border: hsl(12 6.5% 15.1%);
  --input: hsl(12 6.5% 15.1%);
  --ring: hsl(24 5.7% 82.9%);
  --sidebar-background: hsl(240 5.9% 10%);
  --sidebar-foreground: hsl(240 4.8% 95.9%);
  --sidebar-primary: hsl(224.3 76.3% 48%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(240 3.7% 15.9%);
  --sidebar-accent-foreground: hsl(240 4.8% 95.9%);
  --sidebar-border: hsl(240 3.7% 15.9%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);
}

@theme inline {
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  --color-sidebar: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  @media (width >= --theme(--breakpoint-sm)) {
    max-width: none;
  }
  @media (width >= 1400px) {
    max-width: 1400px;
  }
}

/*
  The default border color has changed to `currentcolor` in Tailwind CSS v4,
  so we've added these compatibility styles to make sure everything still
  looks the same as it did with Tailwind CSS v3.

  If we ever want to remove these styles, we need to add an explicit border
  color utility to any element that depends on these defaults.
*/
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentcolor);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

### lib/audio/AudioManager.ts

```ts
import { createContext, useContext } from "react";

export class AudioManager {
  mediaElement: HTMLAudioElement;

  audioObjectURL: string | null = null;

  constructor() {
    const mediaElement = new Audio();

    this.mediaElement = mediaElement;
  }

  async unloadCurrentAudio() {
    if (this.audioObjectURL) {
      URL.revokeObjectURL(this.audioObjectURL);
      this.audioObjectURL = null;
      this.mediaElement.src = "";
    }
  }

  async loadAudio(file: Blob) {
    await this.unloadCurrentAudio();

    const { mediaElement } = this;
    const audioObjectURL = URL.createObjectURL(file);

    this.audioObjectURL = audioObjectURL;

    mediaElement.src = audioObjectURL;
  }

  play() {
    if (this.mediaElement.ended) {
      this.mediaElement.fastSeek(0);
    }

    this.mediaElement.play();
  }

  pause() {
    this.mediaElement.pause();
  }

  destroy() {
    this.unloadCurrentAudio();
    this.mediaElement.pause();
  }
}

const context = createContext<AudioManager>(new AudioManager());

export function useAudioManager() {
  return useContext(context);
}

export const AudionManagerProvider = context.Provider;

```

### lib/audio/getAudioFileData.ts

```ts
export async function getAudioFileData(file: Blob, samples = 200) {
  const ctx = new AudioContext();

  const buffer = await file.arrayBuffer();
  const decodedAudio = await ctx.decodeAudioData(buffer);

  return {
    waveform: transformDecodedAudioToWaveformData(decodedAudio, samples),
    duration: decodedAudio.duration,
  };
}

const transformDecodedAudioToWaveformData = (
  audioBuffer: AudioBuffer,
  samples: number,
) => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision

  const sampledData: number[] = new Array(samples);
  let max = 0;

  for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    const sampledValue = sum / blockSize; // divide the sum by the block size to get the average

    if (max < sampledValue) {
      max = sampledValue;
    }

    sampledData[i] = sampledValue;
  }

  const multiplier = max ** -1;

  for (let i = 0; i < samples; i++) {
    sampledData[i] = sampledData[i] * multiplier;
  }

  return sampledData;
};

```

### lib/audio/useMediaEndListener.ts

```ts
import { useEffect } from "react";
import { useAudioManager } from "./AudioManager";

export function useMediaEndListener(callback: () => void) {
  const audioManager = useAudioManager();

  useEffect(() => {
    audioManager.mediaElement.addEventListener("ended", callback);

    return () => {
      audioManager.mediaElement.removeEventListener("ended", callback);
    };
  }, [audioManager, callback]);
}

```

### lib/audio/usePlayMedia.ts

```ts
import { useRef } from "react";
import { useAudioManager } from "./AudioManager";

export function usePlayMedia() {
  const audioManager = useAudioManager();

  const previousMediaLoad = useRef<Promise<unknown> | undefined>(undefined);

  async function playMedia(file: Blob, autoPlay = true) {
    // Wait for the previous load to finish
    // to avoid to incur into concurrency issues
    await previousMediaLoad.current;

    const promise = audioManager.loadAudio(file);

    previousMediaLoad.current = promise;

    await promise;

    if (autoPlay) {
      audioManager.play();
    }
  }

  return playMedia;
}

```

### lib/audio/usePlayState.ts

```ts
import { useLayoutEffect, useState } from "react";
import { useAudioManager } from "./AudioManager";

export type PlayState = "pause" | "play";

export function usePlayState() {
  const audioManager = useAudioManager();
  const [value, setValue] = useState<PlayState>("pause");

  useLayoutEffect(() => {
    setValue(audioManager.mediaElement.paused ? "pause" : "play");

    const onPlay = () => {
      setValue("play");
    };

    const onPause = () => {
      setValue("pause");
    };

    audioManager.mediaElement.addEventListener("play", onPlay);
    audioManager.mediaElement.addEventListener("pause", onPause);

    return () => {
      audioManager.mediaElement.removeEventListener("play", onPlay);
      audioManager.mediaElement.removeEventListener("pause", onPause);
    };
  }, [audioManager]);

  function togglePlayState() {
    if (value === "pause") {
      audioManager.play();
    } else {
      audioManager.pause();
    }
  }

  return { value, toggle: togglePlayState };
}

```

### lib/audio/usePlayerCurrentTime.ts

```ts
import { useLayoutEffect, useState } from "react";
import { AudioManager, useAudioManager } from "./AudioManager";

export function usePlayerCurrentTime() {
  const audioManager = useAudioManager();
  const [value, setValue] = useState<number>(0);

  useLayoutEffect(() => {
    setValue(getPlayerCurrentTime(audioManager));

    return subscribeToPlayerCurrentTime(audioManager, setValue);
  }, [audioManager]);

  function setCurrentTime(time: number) {
    if (audioManager.mediaElement.paused) audioManager.play();

    // eslint-disable-next-line react-compiler/react-compiler
    audioManager.mediaElement.currentTime = time;
  }

  return {
    value,
    setValue: setCurrentTime,
  };
}

export function setPlayerCurrentTime(audioManager: AudioManager, time: number) {
  audioManager.mediaElement.currentTime = time;
}

export function getPlayerCurrentTime(audioManager: AudioManager): number {
  return audioManager.mediaElement.currentTime;
}

export function subscribeToPlayerCurrentTime(
  audioManager: AudioManager,
  callback: (time: number) => void,
) {
  const onTimeUpdate = () => {
    callback(audioManager.mediaElement.currentTime);
  };

  audioManager.mediaElement.addEventListener("timeupdate", onTimeUpdate);

  return () => {
    audioManager.mediaElement.removeEventListener("timeupdate", onTimeUpdate);
  };
}

```

### lib/getters.ts

```ts
import { MusicaAccount } from "../1_schema";

export async function getNextTrack() {
  const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        activePlaylist: {
          tracks: true,
        },
      },
    },
  });

  const tracks = me.root.activePlaylist.tracks;
  const activeTrack = me.root.$jazz.refs.activeTrack;

  const currentIndex = tracks.findIndex(
    (item) => item?.$jazz.id === activeTrack?.id,
  );

  const nextIndex = (currentIndex + 1) % tracks.length;

  return tracks[nextIndex];
}

export async function getPrevTrack() {
  const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        activePlaylist: {
          tracks: true,
        },
      },
    },
  });

  const tracks = me.root.activePlaylist.tracks;
  const activeTrack = me.root.$jazz.refs.activeTrack;

  const currentIndex = tracks.findIndex(
    (item) => item?.$jazz.id === activeTrack?.id,
  );

  const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  return tracks[previousIndex];
}

```

### lib/useKeyboardListener.ts

```ts
import { useEffect } from "react";

export function useKeyboardListener(code: string, callback: () => void) {
  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if (evt.code === code) {
        callback();
      }
    };
    window.addEventListener("keyup", handler);

    return () => {
      window.removeEventListener("keyup", handler);
    };
  }, [callback, code]);
}

```

### lib/usePrepareAppState.ts

```ts
import { MusicaAccount, MusicaAccountRoot } from "@/1_schema";
import { MediaPlayer } from "@/5_useMediaPlayer";
import { co } from "jazz-tools";
import { useAgent } from "jazz-tools/react";
import { useEffect, useState } from "react";
import { uploadMusicTracks } from "../4_actions";

export function usePrepareAppState(mediaPlayer: MediaPlayer) {
  const [isReady, setIsReady] = useState(false);

  const agent = useAgent();

  useEffect(() => {
    loadInitialData(mediaPlayer).then(() => {
      setIsReady(true);
    });
  }, [agent]);

  return isReady;
}

async function loadInitialData(mediaPlayer: MediaPlayer) {
  const me = await MusicaAccount.getMe().$jazz.ensureLoaded({
    resolve: {
      root: {
        activeTrack: { $onError: "catch" },
      },
    },
  });

  uploadOnboardingData(me.root);

  // Load the active track in the AudioManager
  if (me.root.activeTrack?.$isLoaded) {
    mediaPlayer.loadTrack(me.root.activeTrack, false);
  }
}

async function uploadOnboardingData(root: co.loaded<typeof MusicaAccountRoot>) {
  if (root.exampleDataLoaded) return;

  root.$jazz.set("exampleDataLoaded", true);

  try {
    const trackFile = await (await fetch("/example.mp3")).blob();

    await uploadMusicTracks([new File([trackFile], "Example song")], true);
  } catch (error) {
    root.$jazz.set("exampleDataLoaded", false);
    throw error;
  }
}

```

### lib/utils.ts

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```

### vite-env.d.ts

```ts
/// <reference types="vite/client" />

```
