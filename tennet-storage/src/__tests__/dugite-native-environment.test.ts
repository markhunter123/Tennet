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

import assert from 'node:assert/strict';
import test from 'node:test';
import { bundledGitEnvironment } from '../dugite-native-environment.js';

test('constructs a Windows MinGit environment without a system PATH', () => {
  assert.deepEqual(
    bundledGitEnvironment({
      platform: 'win32',
      arch: 'arm64',
      rootPath: 'C:\\Tennet\\resources\\git',
      executablePath: 'C:\\Tennet\\resources\\git\\cmd\\git.exe',
    }),
    {
      PATH: [
        'C:\\Tennet\\resources\\git\\cmd',
        'C:\\Tennet\\resources\\git\\clangarm64\\bin',
        'C:\\Tennet\\resources\\git\\clangarm64\\usr\\bin',
      ].join(';'),
      GIT_EXEC_PATH: 'C:\\Tennet\\resources\\git\\clangarm64\\libexec\\git-core',
    },
  );
});

test('constructs relocatable macOS and Linux Git environments', () => {
  assert.deepEqual(
    bundledGitEnvironment({
      platform: 'darwin',
      arch: 'arm64',
      rootPath: '/Applications/Tennet.app/Contents/Resources/git',
      executablePath: '/Applications/Tennet.app/Contents/Resources/git/bin/git',
    }),
    {
      PATH: '/Applications/Tennet.app/Contents/Resources/git/bin',
      GIT_EXEC_PATH: '/Applications/Tennet.app/Contents/Resources/git/libexec/git-core',
      GIT_TEMPLATE_DIR: '/Applications/Tennet.app/Contents/Resources/git/share/git-core/templates',
    },
  );
  assert.deepEqual(
    bundledGitEnvironment({
      platform: 'linux',
      arch: 'x64',
      rootPath: '/opt/tennet/resources/git',
      executablePath: '/opt/tennet/resources/git/bin/git',
    }),
    {
      PATH: '/opt/tennet/resources/git/bin',
      GIT_EXEC_PATH: '/opt/tennet/resources/git/libexec/git-core',
      GIT_TEMPLATE_DIR: '/opt/tennet/resources/git/share/git-core/templates',
      PREFIX: '/opt/tennet/resources/git',
      GIT_SSL_CAINFO: '/opt/tennet/resources/git/ssl/cacert.pem',
    },
  );
});
