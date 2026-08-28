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

import { homedir } from 'node:os';
import { posix, win32 } from 'node:path';

const DEFAULT_TENNET_PROFILE_NAME = 'Tennet';

export interface ResolveTennetClientDataRootInput {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  profileName?: string;
}

export interface ResolveTennetWorkspaceRootInput extends ResolveTennetClientDataRootInput {
  workspaceName?: string;
}

export interface DeriveTennetDataRootsInput {
  platform?: NodeJS.Platform;
  workspaceName?: string;
}

export interface TennetDataRoots {
  readonly clientDataRoot: string;
  readonly workspaceRoot: string;
}

export function resolveTennetClientDataRoot(input: ResolveTennetClientDataRootInput = {}): string {
  const platform = input.platform ?? process.platform;
  const env = input.env ?? process.env;
  const home = input.homeDir ?? homedir();
  const profileName = input.profileName ?? DEFAULT_TENNET_PROFILE_NAME;
  assertTennetProfileName(profileName);
  return resolveElectronUserDataRoot(platform, env, home, profileName);
}

export function deriveTennetDataRoots(
  clientDataRoot: string,
  input: DeriveTennetDataRootsInput = {},
): TennetDataRoots {
  const platform = input.platform ?? process.platform;
  const workspaceName = input.workspaceName ?? 'default';
  const pathApi = platform === 'win32' ? win32 : posix;
  return {
    clientDataRoot,
    workspaceRoot: pathApi.join(clientDataRoot, 'workspaces', workspaceName),
  };
}

export function resolveTennetWorkspaceRoot(input: ResolveTennetWorkspaceRootInput = {}): string {
  return resolveTennetDataRoots(input).workspaceRoot;
}

export function resolveTennetDataRoots(input: ResolveTennetWorkspaceRootInput = {}): TennetDataRoots {
  return deriveTennetDataRoots(resolveTennetClientDataRoot(input), input);
}

function resolveElectronUserDataRoot(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  home: string,
  profileName: string,
): string {
  if (platform === 'darwin') {
    return posix.join(home, 'Library', 'Application Support', profileName);
  }
  if (platform === 'win32') {
    return win32.join(env.APPDATA || win32.join(home, 'AppData', 'Roaming'), profileName);
  }
  return posix.join(resolveXdgConfigHome(env, home), profileName);
}

export function resolveXdgConfigHome(
  env: NodeJS.ProcessEnv = process.env,
  homeDir: string = homedir(),
): string {
  const configured = env.XDG_CONFIG_HOME;
  return configured && posix.isAbsolute(configured) ? configured : posix.join(homeDir, '.config');
}

function assertTennetProfileName(profileName: string): void {
  if (
    profileName.length === 0 ||
    profileName === '.' ||
    profileName === '..' ||
    /[\\/\0]/u.test(profileName)
  ) {
    throw new Error('Tennet profile name must be a non-empty path segment');
  }
}
