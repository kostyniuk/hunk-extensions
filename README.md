# Hunk extensions

Extensions for [Hunk](https://github.com/modem-dev/hunk), the terminal-based diff reviewer.

## Included extensions

| Extension | Description |
| --- | --- |
| [`reviewed-files`](./reviewed-files) | Adds session-only reviewed-file markers, review progress, note counts, and collapsible file diffs. |

## Requirements

The extension API currently requires Hunk `0.18.0-beta.0` or newer:

```sh
npm install -g hunkdiff@beta
```

## Install

Clone the repository and link the extension into Hunk's global extension directory:

```sh
git clone https://github.com/kostyniuk/hunk-extensions.git
cd hunk-extensions
mkdir -p ~/.config/hunk/extensions
ln -s "$(pwd)/reviewed-files" ~/.config/hunk/extensions/reviewed-files
```

Hunk will then discover it automatically. To try it without installing:

```sh
hunk diff --extension ./reviewed-files
```

See the [`reviewed-files` documentation](./reviewed-files/README.md) for its controls and configuration.

## Development

```sh
cd reviewed-files
bun install
bun test
bun run typecheck
```

Hunk's extension API is experimental, so compatibility may change between prereleases.

## License

[MIT](./LICENSE)
