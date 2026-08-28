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

import { realpath } from 'node:fs/promises';
import type { SessionEvent, ShellRunSnapshotResult, ShellRunUpdate } from '@tennet/core/events';
import type { OrchestrationMode } from '@tennet/core/orchestration';
import type { PermissionMode } from '@tennet/core/permission';
import type { SandboxBoundaryResponse } from '@tennet/core/sandbox-boundary';
import type { SessionSummary, StoredMessage } from '@tennet/core/session';
import type { ThinkingLevel } from '@tennet/core/model-thinking';
import type { CreateSessionInput, TurnOrchestration } from '@tennet/core/runtime-inputs';
import type { UserQuestionResponse } from '@tennet/core/user-question';
import type { ContextDiagnostics } from '@tennet/runtime/context-diagnostics';
import type { SkillInvocationResult } from '@tennet/core/skill-invocation';
import type {
  GoalControlAction,
  GoalProjection,
  TurnMessageQueryResult,
  TurnMessageSubmitResult,
} from '@tennet/runtime-host/protocol';

export interface TennetSessionMoveResult {
  previousCwd: string;
  cwd: string;
  changed: boolean;
  oldCwdDirty?: boolean;
}

export interface TennetSessionSwitchOptions {
  /** Explicitly relocate the durable Session cwd before attaching to it. */
  relocateCwd?: string;
}

export type InspectCwdChanges = (cwd: string) => Promise<boolean | undefined>;

export interface RewindTarget {
  turnId: string;
  label: string;
}

export interface TennetSessionSwitchResult {
  summary: SessionSummary;
  messages: StoredMessage[];
  activeTurn?: TennetPreparedSessionTurn;
  relocation?: TennetSessionMoveResult;
}

export interface TennetSessionRewindResult extends TennetSessionSwitchResult {
  prompt: string;
}

export interface TennetSideConversationOpenResult extends TennetSessionSwitchResult {
  parentSessionId: string;
  sideSessionId: string;
}

export interface TennetSideConversationCloseResult extends TennetSessionSwitchResult {
  cleanup: 'removed' | 'pending';
}

export type TennetSideConversationParentStatus =
  | 'needs_input'
  | 'needs_approval'
  | 'failed'
  | 'interrupted'
  | 'closed'
  | 'finished';

export interface TennetPreparedSessionTurn {
  sessionId: string;
  turnId: string;
  runId?: string;
  events: AsyncIterable<SessionEvent>;
  summary?: SessionSummary;
  skillInvocation?: SkillInvocationResult;
}

export interface TennetAttachedSessionTurn extends TennetPreparedSessionTurn {
  messages: StoredMessage[];
  summary: SessionSummary;
}

export interface TennetPreparePromptOptions {
  turnId?: string;
  modelText?: string;
  turnOrchestration?: TurnOrchestration;
  maxSteps?: number;
}

export interface TennetSubmitMessageOptions {
  messageId: string;
  placement: 'current_turn' | 'next_turn';
  modelText?: string;
  /** Exact-Turn intent carried to Runtime Host, which decides how to admit it. */
  turnOrchestration?: TurnOrchestration;
}

export interface TennetRetractedMessages {
  text: string;
  messageIds: readonly string[];
}

/**
 * Why Runtime Host refused to open a Turn for an explicit Skill invocation.
 * `turn.start`'s only remaining caller is headless `tennet run`, which reports
 * this as an ordinary failure, so the reasons belong in the message rather
 * than in a payload nothing reads.
 */
export function skillInvocationBlockedMessage(skillInvocation: SkillInvocationResult): string {
  const reasons = skillInvocation.failed.map((failure) =>
    failure.reason === 'too_many_requests'
      ? `more than ${failure.requestLimit} Skill requests`
      : `/skill:${failure.request} (${failure.reason.replaceAll('_', ' ')})`,
  );
  return reasons.length > 0
    ? `Could not resolve the Skill this Turn asked for: ${reasons.join(', ')}`
    : 'Explicit Skill invocation could not be resolved';
}

export interface TennetUserCommand {
  readonly commandId: string;
  readonly result: ShellRunSnapshotResult;
  /** Returns the newest update that raced the initial card into the transcript. */
  takeRacedUpdate(): ShellRunUpdate['result'] | undefined;
}

export interface TennetSessionDriver {
  listSessions(): Promise<SessionSummary[]>;
  getSessionResumeAvailability?(session: SessionSummary): Promise<SessionResumeAvailability>;
  preparePrompt(
    prompt: string,
    options?: TennetPreparePromptOptions,
  ): Promise<TennetPreparedSessionTurn>;
  /**
   * Submits one Message and reports how Runtime Host admitted it. `undefined`
   * means the outcome could not be proven, so the caller keeps its row.
   */
  submitMessage(
    text: string,
    options: TennetSubmitMessageOptions,
  ): Promise<TurnMessageSubmitResult | undefined>;
  queryCancelledMessages(messageIds: readonly string[]): Promise<TurnMessageQueryResult>;
  /** Runs one user-owned command. Its input/output never becomes model prompt history. */
  runUserCommand?(command: string): Promise<TennetUserCommand>;
  /** Stops every live user-owned command started by this driver. */
  stopUserCommands?(): Promise<void>;
  compactSession(): AsyncIterable<SessionEvent>;
  resumeLatest?(): AsyncIterable<SessionEvent>;
  retractQueued?(): Promise<TennetRetractedMessages>;
  respondToSandboxBoundary(response: SandboxBoundaryResponse): Promise<void>;
  respondToUserQuestion?(response: UserQuestionResponse): Promise<void>;
  setModel(model: string, connectionSlug?: string): Promise<void>;
  setThinkingLevel(level: ThinkingLevel | undefined): Promise<void>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setOrchestrationMode?(mode: OrchestrationMode): Promise<void>;
  renameSession(name: string): Promise<string | void>;
  moveSession?(cwd: string): Promise<TennetSessionMoveResult>;
  switchSession(
    sessionId: string,
    options?: TennetSessionSwitchOptions,
  ): Promise<TennetSessionSwitchResult>;
  listRewindTargets(): Promise<RewindTarget[]>;
  rewindToTurn(turnId: string): Promise<TennetSessionRewindResult>;
  openSideConversation?(): Promise<TennetSideConversationOpenResult>;
  closeSideConversation?(
    sideSessionId: string,
    parentSessionId: string,
  ): Promise<TennetSideConversationCloseResult>;
  observeSideConversationParent?(
    parentSessionId: string,
    listener: (status: TennetSideConversationParentStatus | undefined) => void,
  ): Promise<() => Promise<void>>;
  discardSideConversation?(sideSessionId: string): Promise<'removed' | 'pending'>;
  subscribeStartedTurns?(listener: (turn: TennetAttachedSessionTurn) => void): () => void;
  subscribeResolvedInteractions?(
    listener: (sessionId: string, requestId: string) => void,
  ): () => void;
  subscribeTranscriptReplacements?(
    listener: (
      sessionId: string,
      turnId: string,
      messages: readonly StoredMessage[],
      reason: TennetTranscriptReplacementReason,
    ) => void,
  ): () => void;
  /**
   * Prepares a fresh Session: stops every live user-owned command first so
   * their cards and Ctrl+C affordance never outlive the identity swap.
   * Rejects without changing Session identity when a stop fails (#3210).
   */
  startNewSession(): Promise<void>;
  stop(): Promise<void>;
  getSessionId(): string | null;
  /**
   * The current session's goal projection, or null when no goal is set.
   * Read from the live session projection (push-updated); subscribe to
   * subscribeGoalChanges for updates. Optional: drivers without a goal
   * authority leave goal UI hidden.
   */
  getGoal?(): GoalProjection | null;
  /**
   * Fires when the session's goal projection changes — set, settled, paused,
   * resumed, cleared, or when the attached session changes.
   */
  subscribeGoalChanges?(listener: (goal: GoalProjection | null) => void): () => void;
  /**
   * Applies a goal control action (pause/resume/clear) with optimistic
   * revision retry, mirroring the desktop client. Resolves with the resulting
   * projection, or null when no goal is armed (or the goal disappeared to a
   * concurrent control action mid-flight — for clear that is the desired end
   * state). Optional: drivers without a goal authority reject goal control.
   */
  controlGoal?(action: GoalControlAction): Promise<GoalProjection | null>;
  getContextDiagnostics?(): Promise<ContextDiagnostics>;
  getOrchestrationMode?(): OrchestrationMode;
  /**
   * The mode in force, or `undefined` when no Session exists yet and the
   * driver has no local claim on what a new one will start in — the owning
   * runtime resolves that from its own configured default. Callers that must
   * render something choose their own stand-in rather than being handed an
   * invented mode here.
   */
  getPermissionMode?(): PermissionMode | undefined;
}

/**
 * A create request whose permission mode may be left to the owning runtime.
 *
 * `CreateSessionInput` requires a mode because the local runtime writes it
 * straight onto the Session header. A client speaking to a Runtime Host is in
 * a different position: the Host resolves an omitted mode from its Runtime
 * Policy `chatDefaults`. Omitting the field is how a client says "no explicit
 * choice", and it is the only way the configured default can apply — sending
 * a literal would silently override it.
 */
export type CreateSessionRequest = Omit<CreateSessionInput, 'permissionMode'> & {
  permissionMode?: PermissionMode;
};

export type TennetTranscriptReplacementReason = 'reconcile' | 'reconnect';

export type SessionResumeAvailability = { available: true } | { available: false; reason: string };

export async function inspectSessionResumeAvailability(
  session: SessionSummary,
): Promise<SessionResumeAvailability> {
  if (!session.cwd) return { available: false, reason: 'Missing working directory' };
  try {
    await realpath(session.cwd);
    return { available: true };
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return { available: false, reason: 'Working directory no longer exists' };
    }
    throw error;
  }
}
