export interface ReviewedFileIdentity {
  path: string;
  patch: string;
}

export interface ReviewSnapshot {
  /** Path -> patch captured when the file was marked reviewed. */
  reviewed: ReadonlyMap<string, string>;
}

type Listener = () => void;

let snapshot: ReviewSnapshot = { reviewed: new Map() };
const listeners = new Set<Listener>();

/** Publish a new immutable snapshot to mounted sidebar components. */
function publish(reviewed: ReadonlyMap<string, string>) {
  snapshot = { reviewed };
  for (const listener of listeners) listener();
}

/** Return the current session-local review state. */
export function getReviewSnapshot() {
  return snapshot;
}

/** Subscribe React or tests to review-state changes. */
export function subscribeToReviewState(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A review mark is valid only while the file still has the same patch. */
export function isFileReviewed(file: ReviewedFileIdentity) {
  return snapshot.reviewed.get(file.path) === file.patch;
}

/** Set one file's reviewed state and return its resulting value. */
export function setFileReviewed(file: ReviewedFileIdentity, reviewed: boolean) {
  const current = isFileReviewed(file);
  if (current === reviewed) return reviewed;

  const next = new Map(snapshot.reviewed);
  if (reviewed) next.set(file.path, file.patch);
  else next.delete(file.path);
  publish(next);
  return reviewed;
}

/** Toggle one file's reviewed state and return its resulting value. */
export function toggleFileReviewed(file: ReviewedFileIdentity) {
  return setFileReviewed(file, !isFileReviewed(file));
}

/** Drop marks for removed or changed files when Hunk reloads the changeset. */
export function reconcileReviewedFiles(files: readonly ReviewedFileIdentity[]) {
  const currentPatches = new Map(files.map((file) => [file.path, file.patch]));
  const next = new Map(
    [...snapshot.reviewed].filter(
      ([path, reviewedPatch]) => currentPatches.get(path) === reviewedPatch,
    ),
  );

  if (next.size === snapshot.reviewed.size) return;
  publish(next);
}

/** Clear all marks; primarily useful for tests and the extension command. */
export function clearReviewedFiles() {
  if (snapshot.reviewed.size === 0) return;
  publish(new Map());
}
