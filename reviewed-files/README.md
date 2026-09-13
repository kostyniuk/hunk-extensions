# Reviewed files for Hunk

A session-only Hunk extension that adds review progress and compact file collapsing:

- `○` changes to a green `●` when a file is reviewed.
- Existing inline notes remain visible in the sidebar as Hunk's `*N` badge.
- `p` toggles the selected file's reviewed state. Marking reviewed collapses it; unmarking expands it.
- `x` collapses or expands the selected file without changing its reviewed state.
- Clicking the circle toggles only the review mark. Hunk's current sidebar API cannot switch file presentations from a mouse handler, so use `p` when you want review + collapse together.
- Review marks reset when Hunk exits and are invalidated if a file's patch changes during the session.

## Requirements

The extension API is currently available in Hunk `0.18.0-beta.0` or newer. Check with:

```sh
hunk --version
```

If needed, install the beta with `npm install -g hunkdiff@beta`.

## Try it from this checkout

```sh
hunk diff --extension ./reviewed-files
```

## Install it

Copy this directory to:

```text
~/.config/hunk/extensions/reviewed-files/
```

Only `package.json`, `index.tsx`, and `reviewState.ts` are required at runtime. Hunk loads the TypeScript directly; there is no build step.

## Optional key remapping

The command ids are `reviewed-files.toggle-reviewed`, `reviewed-files.toggle-collapse`, and `reviewed-files.clear-reviewed`:

```toml
[keybindings]
"reviewed-files.toggle-reviewed" = "p"
"reviewed-files.toggle-collapse" = "x"
```

Collapsed presentation is temporarily unavailable while editing an inline review note; Hunk falls back to the raw diff in that situation.
