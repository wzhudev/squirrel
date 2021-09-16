# 🐿️ squirrel

A no (or low) config bundler for bundling Typescript libraries. Auto-detect secondary entry points and build them for you.

## Usage

One-line command

```sh
npx run @wendellhu/squirrel
```

Or add this to your 'package.json' file

```diff
"scripts": {
+  "build": "squirrel"
}
"
```

install and then build

```sh
npm install @wendellhu/squirrel
npm run build
```

## Config

```json
{
    "$schema": {
        "type": "string"
    },
    "dest": {
        "description": "Destination for production files",
        "type": "string",
        "default": "publish"
    },
    "entryFileName": {
        "description": "Entry file name",
        "type": "string",
        "default": "publicApi.ts"
    },
    "srcRoot": {
        "description": "Root dir name of the source files",
        "type": "string",
        "default": "src"
    },
    "tsConfig": {
        "description": "Relative path to the ts config file",
        "type": "string",
        "default": "tsconfig.json"
    },
    "copyFiles": {
        "description": "Files should copied to dest folder",
        "type": "array",
        "default": ["README.md"]
    }
}
```

## Secondary Entry Points

Sometimes you don't want to group symbols with those exported from the primary entry points. The module id of a secondary entry directs the module loader to a sub-directory by the secondary's name.

```typescript
import { Injector } from '@wendellhu/redi' // a dependency injection framework
import { connectDependencies } from '@wendellhu/redi/react-bindings' // some utils to help bind your React app to the dependency injection framework
```

You can just put a 'package.json' file in that sub folder and create a 'publicApi.ts' file to export things you want to export:

```
/src
  /react-bindings
    publicApi.ts
    package.json
  publicApi.ts
```

```json
// package.json
{
    "$schema": "https://raw.githubusercontent.com/wendellhu95/squirrel/master/src/schema/squirrel.schema.json",
    "entryFileName": "./publicApi.ts"
}
```

```ts
export { useInjector, WithDependency } from './reactHooks'
export { connectInjector, connectDependencies } from './reactComponent'
export { RediContext } from './reactContext'
```

And that's it! Squirrel would discover secondary entry points by searching these 'package.json' files.

## Entry Point Encapsulation & Cyclic Dependency Prohibition

Import from files outside of a entry point via relative path is forbidden. Squirrel would throw error if it detect that entry point encapsulation is violated.

For example, relatively import secondary entry point 'src/foo' would cause an error.

```ts
// src/foo/bar.ts
import {} from '../buz.ts' // error!
```

You need to use absolute path to import in this case:

```ts
import {} from 'your-package-name'
```

Also, if an entry points cyclically depends on itself, Squirrel would throw an error and stop bundling.

```ts
// src/buz.ts
import {} from 'your-package-name/foo'

// src/foo/bar.ts
import {} from 'your-package-name' // error!
```

## Used by

-   [redi](https://github.com/wendellhu95/redi), a dependency injection library

## License

MIT. Copyright 2021 Wendell Hu.
