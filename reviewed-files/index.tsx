/** @jsxImportSource @opentui/react */

import type { ScrollBoxRenderable } from "@opentui/core";
import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";

import type {
  ExtensionDiffFile,
  ExtensionSidebarViewProps,
  HunkExtensionAPI,
} from "hunkdiff/extension";

import {
  clearReviewedFiles,
  getReviewSnapshot,
  isFileReviewed,
  reconcileReviewedFiles,
  subscribeToReviewState,
  toggleFileReviewed,
} from "./reviewState";

const COLLAPSED_VIEW_ID = "collapsed";

/** Fit a path into one terminal row without importing Hunk's private text helpers. */
function fitPath(path: string, width: number) {
  if (path.length <= width) return path.padEnd(width);
  if (width <= 1) return "…";
  return `${path.slice(0, width - 1)}…`;
}

/** Render the review-aware replacement for Hunk's default file sidebar. */
function ReviewedFilesSidebar({
  files,
  selectedFileId,
  width,
  theme,
  actions,
}: ExtensionSidebarViewProps): ReactNode {
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);
  const review = useSyncExternalStore(
    subscribeToReviewState,
    getReviewSnapshot,
    getReviewSnapshot,
  );
  const reviewedCount = useMemo(
    () => files.filter((file) => review.reviewed.get(file.path) === file.patch).length,
    [files, review],
  );

  useEffect(() => {
    if (selectedFileId) scrollRef.current?.scrollChildIntoView(`review-file:${selectedFileId}`);
  }, [selectedFileId]);

  return (
    <scrollbox
      ref={scrollRef}
      width="100%"
      height="100%"
      focused={false}
      scrollY={true}
      viewportCulling={true}
      rootOptions={{ backgroundColor: theme.panel }}
      wrapperOptions={{ backgroundColor: theme.panel }}
      viewportOptions={{ backgroundColor: theme.panel }}
      contentOptions={{ backgroundColor: theme.panel }}
      verticalScrollbarOptions={{ visible: false }}
      horizontalScrollbarOptions={{ visible: false }}
    >
      <box style={{ width: "100%", flexDirection: "column", backgroundColor: theme.panel }}>
        <text
          content={` ${reviewedCount}/${files.length} reviewed · p mark · x fold`}
          style={{ fg: theme.muted, bg: theme.panel }}
        />
        {files.map((file) => {
          const reviewed = isFileReviewed(file);
          const selected = file.id === selectedFileId;
          const rowBackground = selected ? theme.panelAlt : theme.panel;
          const noteCount = file.agent?.annotations.length ?? 0;
          const stats = [
            noteCount > 0 ? { kind: "note", text: `*${noteCount}` } : null,
            file.stats.additions > 0
              ? { kind: "addition", text: `+${file.stats.additions}` }
              : null,
            file.stats.deletions > 0
              ? { kind: "deletion", text: `-${file.stats.deletions}` }
              : null,
          ].filter((stat): stat is { kind: string; text: string } => stat !== null);
          const statsWidth = stats.reduce((total, stat) => total + stat.text.length + 1, 0);
          const pathWidth = Math.max(1, width - 4 - statsWidth);

          return (
            <box
              key={file.id}
              id={`review-file:${file.id}`}
              style={{
                width: "100%",
                height: 1,
                flexDirection: "row",
                backgroundColor: rowBackground,
              }}
              onMouseUp={() => actions.selectFile(file.id)}
            >
              <box
                style={{
                  width: 1,
                  height: 1,
                  backgroundColor: selected ? theme.accent : rowBackground,
                }}
              />
              <text
                content={reviewed ? " ● " : " ○ "}
                style={{
                  fg: reviewed ? theme.badgeAdded : theme.muted,
                  bg: rowBackground,
                }}
                onMouseUp={(event) => {
                  event.stopPropagation();
                  actions.selectFile(file.id);
                  const next = toggleFileReviewed(file);
                  actions.notify(`${next ? "Reviewed" : "Unreviewed"} ${file.path}`);
                }}
              />
              <text
                content={fitPath(file.path, pathWidth)}
                style={{ fg: reviewed ? theme.muted : theme.text, bg: rowBackground }}
              />
              {stats.map((stat) => (
                <text
                  key={stat.kind}
                  content={` ${stat.text}`}
                  style={{
                    fg:
                      stat.kind === "note"
                        ? theme.noteBorder
                        : stat.kind === "addition"
                          ? theme.badgeAdded
                          : theme.badgeRemoved,
                    bg: rowBackground,
                  }}
                />
              ))}
            </box>
          );
        })}
      </box>
    </scrollbox>
  );
}

/** Return a compact one-line presentation while retaining Hunk's file header. */
function collapsedFileLayout(file: ExtensionDiffFile) {
  const stats = `+${file.stats.additions} -${file.stats.deletions}`;
  return {
    rows: [
      {
        id: "collapsed",
        spans: [
          { text: "  ▸ Collapsed", tone: "accent-muted" as const },
          { text: ` · ${stats}`, tone: "muted" as const },
        ],
      },
    ],
    hunkRows: (file.hunks ?? []).map(() => ({ startRow: 0, endRow: 0 })),
  };
}

/** Register session-only review marks and a compact collapsed file presentation. */
export default function registerReviewedFiles(hunk: HunkExtensionAPI) {
  hunk.registerSidebarView({
    id: "files",
    title: "Reviewed files",
    replacesDefault: true,
    component: ReviewedFilesSidebar,
  });

  hunk.registerFileView({
    id: COLLAPSED_VIEW_ID,
    title: "Collapsed file",
    matches: () => true,
    layout: ({ file }) => collapsedFileLayout(file),
  });

  hunk.registerCommand(
    { id: "toggle-reviewed", title: "Mark selected file reviewed/unreviewed", key: "p" },
    (ctx) => {
      const file = ctx.selection.file;
      if (!file) {
        ctx.notify("No file is selected", "warning");
        return;
      }

      const reviewed = toggleFileReviewed(file);
      if (reviewed) ctx.fileViews.select(COLLAPSED_VIEW_ID);
      else ctx.fileViews.select(null);
      ctx.notify(`${reviewed ? "Reviewed and collapsed" : "Unreviewed and expanded"} ${file.path}`);
    },
  );

  hunk.registerCommand(
    { id: "toggle-collapse", title: "Collapse/expand selected file", key: "x" },
    (ctx) => {
      const file = ctx.selection.file;
      if (!file) {
        ctx.notify("No file is selected", "warning");
        return;
      }

      const wasCollapsed = ctx.fileViews.isActive(COLLAPSED_VIEW_ID);
      ctx.fileViews.toggle(COLLAPSED_VIEW_ID);
      ctx.notify(`${wasCollapsed ? "Expanded" : "Collapsed"} ${file.path}`);
    },
  );

  hunk.registerCommand({ id: "clear-reviewed", title: "Clear reviewed file marks" }, (ctx) => {
    clearReviewedFiles();
    ctx.notify("Cleared reviewed file marks");
  });

  hunk.on("changeset_loaded", ({ changeset }) => reconcileReviewedFiles(changeset.files));
}
