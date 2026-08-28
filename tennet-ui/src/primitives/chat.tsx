/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

"use client";

import type React from "react";
import { cn } from "../utils.js";

/**
 * `Marker` — the per-turn status / lineage / footer chrome (issue #332, PR2).
 *
 * Retires the bespoke `.tennet-turn-summary*`, `.tennet-turn-aborted-marker`,
 * `.tennet-turn-lineage-*`, and `.tennet-turn-footer*` shell
 * CSS (spread across `tennet-tokens.css`, `styles/settings/models.css`, and the
 * re-anchored measure-column block in `styles/tool-output.css`), moving each
 * onto package-owned semantic classes.
 *
 * The measure-column geometry the old `tool-output.css` re-anchor applied to
 * the summary / lineage rows / footer is gone rather than moved: `.tennet-turn`
 * is the column, and every `Marker` renders inside one, so a second cap on the
 * chrome could only ever be the same edge stated twice.
 *
 * `markerVariants` is exported from THIS module as a local variant recipe
 * so the lineage badge + footer action — which render as `UiButton` and can't
 * be wrapped — apply the shell via `className`; `Button` runs it through
 * `cn` last so consumers can append their own product hook.
 * It is intentionally kept OFF the `@tennet/ui` package barrel (see `index.ts`):
 * the only consumers import it by relative path, so the variant table stays an
 * internal, freely-removable styling detail rather than public API.
 *
 */
export type MarkerVariant =
  | "aborted"
  | "host-origin"
  | "lineage-row"
  | "lineage-row-reverse"
  | "lineage-badge"
  | "footer"
  | "footer-action";

const MARKER_CLASSES: Record<MarkerVariant, string> = {
  aborted: "tennet-turn-aborted-marker",
  "host-origin": "tennet-turn-host-origin",
  "lineage-row": "tennet-turn-lineage-row",
  "lineage-row-reverse": "tennet-turn-lineage-row tennet-turn-lineage-row-reverse",
  "lineage-badge": "tennet-turn-lineage-badge",
  footer: "tennet-turn-footer",
  "footer-action": "tennet-turn-footer-action",
};

function markerVariants({ variant }: { variant: MarkerVariant }): string {
  return MARKER_CLASSES[variant];
}

export { markerVariants };

export interface MarkerProps extends React.ComponentPropsWithoutRef<"div"> {
  variant: MarkerVariant;
  // The summary chips were authored as inline `<span>`s; the containers /
  // markers as `<div>`s. Keep the original tag so the semantic-class
  // conversion is structurally identical (zero behavioral change).
  as?: "div" | "span";
}

export function Marker({
  className,
  variant,
  as: Tag = "div",
  ...props
}: MarkerProps): React.ReactElement {
  return (
    // `{...props}` first so the `data-slot` / `data-variant` hooks land last and
    // can't be clobbered by a consumer (mirrors Message / Bubble). The styling
    // `data-kind` / `data-state` / `data-direction` etc. flow through `...props`
    // and are read by the literalized `data-[…]:` variants above.
    <Tag
      {...props}
      data-slot="marker"
      data-variant={variant}
      className={cn(markerVariants({ variant }), className)}
    />
  );
}

/**
 * Tool-result preview surfaces (issue #332, PR4).
 *
 * Retires the bespoke `OverlayPreview` family shell CSS — the shared
 * height-bounded `.tennet-overlay-preview` base + `.tennet-overlay-close`, the
 * structured cards (`.tennet-tool-diff*`, `.tennet-tool-terminal*`,
 * `.tennet-explore-agent-*` / `.tennet-subagent-preview`,
 * `.tennet-web-search-*`), and the separate `.tennet-load-tool-*` result card —
 * represented by package-owned semantic classes in `styles.css`.
 *
 * Two structural notes:
 *   1. The chat structured cards carry BOTH the shared `overlay` base AND a kind
 *      part (the retired DOM had `class="tennet-overlay-preview tennet-tool-diff"`),
 *      applied as `cn(previewVariants({part:'overlay'}), previewVariants({part:'diff'}))`.
 *      The kind class follows the shared base and may refine it by normal CSS
 *      source order.
 *   2. Leaf rules authored as descendant selectors on bare tags (e.g.
 *      `.tennet-explore-agent-section li`, `.tennet-web-search-preview > header strong`)
 *      remain descendants of the stable semantic container class.
 *
 * Unlike the other tables, `previewVariants` IS exported on the `@tennet/ui` barrel
 * (`index.ts`): the file-diff `diff` / `diff-body` / `diff-line` parts have a
 * SECOND, cross-package consumer — `tennet-desktop`'s `artifact-preview.tsx`, whose
 * non-chat diff pane shared the retired `.tennet-tool-diff*` shell and co-migrates
 * here. That second consumer is exactly the condition the off-barrel convention
 * named for promotion, so the export is the rule, not an exception.
 *
 * Preview card shells use the shared shadow-ring recipe instead of hard visual
 * borders. Dividers inside the cards remain real borders because they separate
 * rows and headers.
 */
const PREVIEW_PART_CLASSES = {
      // ── shared base ──────────────────────────────────────────────────────
      // `.tennet-overlay-preview` — the height-bounded mono container every
      // overlay preview shares.
      overlay:
        "tennet-overlay-preview",
      // Overlay placement only; Button owns the dismiss action's proportions.
      close: "tennet-overlay-close",

      // ── file diff (shared with tennet-desktop artifact-preview) ─────────────
      // `.tennet-tool-diff` — the card shell. `[white-space:normal]` overrides the
      // overlay base's pre-wrap on the chat consumer.
      diff:
        "tennet-tool-diff",
      // `.tennet-tool-diff-paths` (+ its bare `code` children).
      "diff-paths":
        "tennet-tool-diff-paths",
      // `.tennet-tool-diff-body` — the scrolling mono `<pre>`.
      "diff-body":
        "tennet-tool-diff-body",
      // `.tennet-tool-diff-line` (+ the `[data-line]` add/del/hunk/meta/ctx tints).
      "diff-line":
        "tennet-tool-diff-line",

      // ── terminal ──────────────────────────────────────────────────────────
      // `.tennet-tool-terminal` — same card shell as diff.
      terminal:
        "tennet-tool-terminal",
      // `.tennet-tool-terminal-head`
      "terminal-head":
        "tennet-tool-terminal-head",
      // `.tennet-tool-terminal-cwd`
      "terminal-cwd": "tennet-tool-terminal-cwd",
      // `.tennet-tool-terminal-cmd` — the ellipsized command line.
      "terminal-cmd":
        "tennet-tool-terminal-cmd",
      // `.tennet-tool-terminal-exit` (+ the `[data-ok]` success/failure badge).
      "terminal-exit":
        "tennet-tool-terminal-exit",
      // `.tennet-tool-terminal-empty`
      "terminal-empty":
        "tennet-tool-terminal-empty",
      // `.tennet-tool-terminal-stream` (+ the `[data-stream]` stdout/stderr tone).
      "terminal-stream":
        "tennet-tool-terminal-stream",
      // `.tennet-tool-terminal-truncated-note` (+ its `> span` min-width reset).
      "terminal-truncated-note":
        "tennet-tool-terminal-truncated-note",
      // `.tennet-tool-terminal-copy` (UiButton) + the shared copy-state tints.
      "terminal-copy":
        "tennet-tool-terminal-copy",

      // ── explore agent / subagent (shared shell) ───────────────────────────
      // `.tennet-explore-agent-preview, .tennet-subagent-preview` (+ the fault
      // border, keyed on explore's `[data-ok=false]` or subagent's failed /
      // cancelled `[data-status]`).
      agent:
        "tennet-agent-preview",
      // `.tennet-explore-agent-head` (+ its `strong` title and `small` caption,
      // the latter shared with the nested summary-line small).
      "agent-head":
        "tennet-agent-preview-head",
      // `.tennet-explore-agent-summary-line` (+ its `small` ellipsis, layered over
      // the head's caption styling above).
      "agent-summary-line":
        "tennet-agent-preview-summary-line",
      // `.tennet-explore-agent-actions`
      "agent-actions": "tennet-agent-preview-actions",
      // `.tennet-explore-agent-message`
      "agent-message":
        "tennet-agent-preview-message",
      // `.tennet-explore-agent-meta` (+ its `div` cells, `dt` labels, `dd` values).
      "agent-meta":
        "tennet-agent-preview-meta",
      // `.tennet-explore-agent-section` (+ its direct `> strong`, list `ul`/`li`
      // rows, leading `li` reset, `code` / `small` / `p` / `span` leaves).
      "agent-section":
        "tennet-agent-preview-section",
      // `.tennet-explore-agent-section-head` (+ its `> strong`).
      "agent-section-head":
        "tennet-agent-preview-section-head",
      // `.tennet-explore-agent-copy` (UiButton) + the copied / shared copy-state tints.
      "agent-copy":
        "tennet-agent-preview-copy",

      // ── web search ────────────────────────────────────────────────────────
      // `.tennet-web-search-preview` (+ its bare `> header` / list leaves; the
      // container inherits the overlay base's mono font, never resetting it).
      "web-search":
        "tennet-web-search-preview",
      // `.tennet-web-search-error` — the destructive container tint.
      "web-search-error":
        "tennet-web-search-error",
      // `.tennet-web-search-error-message`
      "web-search-error-message":
        "tennet-web-search-error-message",
      // `.tennet-web-search-error-repair`
      "web-search-error-repair":
        "tennet-web-search-error-repair",

      // ── load-tool result card (separate base; not an overlay) ─────────────
      // `.tennet-load-tool-preview` (+ its `p` margin reset).
      "load-tool":
        "tennet-load-tool-preview",
      // `.tennet-load-tool-title`
      "load-tool-title": "tennet-load-tool-title",
      // `.tennet-load-tool-count`
      "load-tool-count": "tennet-load-tool-count",
} as const;

type PreviewPart = keyof typeof PREVIEW_PART_CLASSES;
const previewVariants = ({ part }: { part: PreviewPart }): string => PREVIEW_PART_CLASSES[part];

export { previewVariants };
