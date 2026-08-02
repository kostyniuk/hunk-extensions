import { beforeEach, describe, expect, test } from "bun:test";

import {
  clearReviewedFiles,
  getReviewSnapshot,
  isFileReviewed,
  reconcileReviewedFiles,
  setFileReviewed,
  subscribeToReviewState,
  toggleFileReviewed,
} from "./reviewState";

const alpha = { path: "src/alpha.ts", patch: "alpha-v1" };

beforeEach(() => clearReviewedFiles());

describe("review state", () => {
  test("toggles a file without writing persistent state", () => {
    expect(toggleFileReviewed(alpha)).toBe(true);
    expect(isFileReviewed(alpha)).toBe(true);
    expect(toggleFileReviewed(alpha)).toBe(false);
    expect(isFileReviewed(alpha)).toBe(false);
  });

  test("invalidates a mark when the file patch changes", () => {
    setFileReviewed(alpha, true);
    const changed = { ...alpha, patch: "alpha-v2" };

    reconcileReviewedFiles([changed]);

    expect(isFileReviewed(alpha)).toBe(false);
    expect(isFileReviewed(changed)).toBe(false);
    expect(getReviewSnapshot().reviewed.size).toBe(0);
  });

  test("retains unchanged files and removes missing files", () => {
    const beta = { path: "src/beta.ts", patch: "beta-v1" };
    setFileReviewed(alpha, true);
    setFileReviewed(beta, true);

    reconcileReviewedFiles([alpha]);

    expect(isFileReviewed(alpha)).toBe(true);
    expect(isFileReviewed(beta)).toBe(false);
  });

  test("notifies subscribers only when state changes", () => {
    let notifications = 0;
    const unsubscribe = subscribeToReviewState(() => notifications++);

    setFileReviewed(alpha, true);
    setFileReviewed(alpha, true);
    setFileReviewed(alpha, false);
    unsubscribe();
    setFileReviewed(alpha, true);

    expect(notifications).toBe(2);
  });
});
