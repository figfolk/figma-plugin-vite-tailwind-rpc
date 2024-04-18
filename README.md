# Figma Plugin Boilerplate: Vite + Tailwind + RPC Framework

## Inspirations
Thanks to the following projects for inpiring us to create this.

1. [CoconutGoodie/figma-plugin-react-vite](https://github.com/CoconutGoodie/figma-plugin-react-vite)

# How to start coding?

1. First thing after you clone should be to install the dependencies by executing:

```
pnpm install
```

2. Create a figma plugin. In Figma, right click while you're in a design file. Follow `Plugins > Development > New Plugin...`. You can also type `"New Plugin...` to the global search (Windows: <kbd>CTRL</kbd> + <kbd>P</kbd>, Mac: <kbd>⌘ Command</kbd> + <kbd>P</kbd>)
3. Follow the steps on opened window. I recommend using `Default` or `Run once` layout, because you'll only need to save the manifest (for the plugin id it generates). Click "Save as", and save it to a temporary place. Then click "Open folder" to navigate to the folder it generated
4. Note down the `id` field from the `manifest.json` it generated.
5. Go to `figma.manifest.ts`, and replace the `id` with the id you noted down. Then configure the manifest there as you like. (See [Official Figma Plugin Manifest doc](https://www.figma.com/plugin-docs/manifest/))

## Developing

Development is very straight forward. Just run the dev command, and it will start compiling your files as you code.

```
npm run dev
```

Once dev is ran, `dist/` folder will be created, which includes your `manifest.json`. You can load it in Figma, by `Right Click > Plugins > Development > Import plugin from manifest...`

**Tip:** You can turn on the `Hot reload plugin` option in Figma, to automatically reload when files in `dist/` changes.

### Developing without Figma Context

If you like developing your UI first, then integrating with Figma context; you can run your UI code in browser just like your every other Vite project by running:

```
npm run dev:ui-only
```

Remember: since Figma context is not available in "ui-only" mode, any attempt to Figma API/SDK calls will look like a crash on your inspector/console.

## Building

Building with the following command line will yield with a `dist` folder, which is ready to be used by Figma:

```
npm run build
```

`dist/manifest.json` then can be used to load the plugin. In Figma, right click while you're in a design file. Follow `Plugins > Development > Import plugin from manifest...`. You can also type `"Import plugin from manifest...` to the global search (Windows: <kbd>CTRL</kbd> + <kbd>P</kbd>, Mac: <kbd>⌘ Command</kbd> + <kbd>P</kbd>). Then select `dist/manifest.json`

## Publishing

After building, built `dist` folder is going to contain every artifact you need in order to publish your plugin. Just build, and follow [Figma's Official Post on Publishing Plugins](https://help.figma.com/hc/en-us/articles/360042293394-Publish-plugins-to-the-Figma-Community#Publish_your_plugin).

## File Structure

WIP.

# Caveats

### 1. Make sure to import SVGS as either component, url or raw!

Importing image assets other than `.svg` is easy. However, when you are importing `.svg`, by default it will load as a base64 data-uri, to import as a React component, you must add the query string `?react`.

```tsx
import MyImage from "@ui/assets/my_image.svg?component"; // <MyImage />
import myImage from "@ui/assets/my_image.svg?url"; // "data:svg+xml,..."
import myImageRaw from "@ui/assets/my_image.svg?raw"; // "<svg>...</svg>"
...

<MyImage className="something" />
<img src={myImage} />
<div dangerouslySetInnerHTML={{ __html: myImageRaw }} />
```
