import { execSync } from 'child_process';
import { dateToStr } from './date';

/**
 * @public
 */
export interface Option {
  fileName?: string;
  timeZone?: string;
  showAuthor?: boolean;
  showMessage?: boolean;
  multiRepo?: boolean;
  repos?: Array<{ name: string; cwd: string }>;
  cwd?: string;
  extra?: object;
}

/**
 * @public
 */
interface CommitInfo {
  id?: string;
  time?: string;
  author?: {
    name: string;
    email: string;
  };
  message?: string;
}

/**
 * exec command
 */
function execCommand(cmd, option?: Option) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], cwd: option?.cwd }).trim();
  } catch {
    return '';
  }
}

/**
 * get branch info
 */
function branchInfo(option?: Option) {
  // 1. Priority: Attempt to get local branch name via modern command (Git 2.22+) - most accurate and intuitive
  let branch = execCommand('git branch --show-current', option);
  if (branch) {
    return branch;
  }

  // 2. Attempt to get Tag (if current commit is a Tag, this is usually more important than branch name)
  branch = execCommand('git describe --tags --exact-match HEAD', option);
  if (branch) {
    return branch;
  }

  // 3. Attempt to get upstream branch (Common in CI environments, Detached HEAD but has upstream)
  branch = execCommand('git rev-parse --abbrev-ref --symbolic-full-name @{u}', option);
  if (branch) {
    return branch;
  }

  // 4. Attempt symbolic-ref (Compatible with older Git, and can accurately distinguish detached HEAD)
  branch = execCommand('git symbolic-ref --short HEAD', option);
  if (branch && !branch.includes('HEAD')) {
    return branch;
  }

  // 5. Attempt rev-parse (Standard method, but returns HEAD in detached HEAD state)
  branch = execCommand('git rev-parse --abbrev-ref HEAD', option);
  if (branch && !branch.includes('HEAD')) {
    return branch;
  }

  // 6. Attempt name-rev (Last resort for Detached HEAD)
  branch = execCommand('git name-rev --name-only HEAD', option);
  if (branch) {
    // Clean up output, e.g., "remotes/origin/main" -> "main"
    branch = branch.replace(/(^remotes\/)?(origin\/)?(tags\/)?(\^\d*$)?/g, '');
    if (branch && !branch.includes('undefined')) {
      return branch;
    }
  }

  return '';
}

/**
 * get commit info
 */
function commitInfo(option?: Option) {
  let commit: CommitInfo = {};

  try {
    const detail = execCommand('git --no-pager log -1 --pretty=format:"%H%x00%an%x00%ae%x00%ci%x00%s" HEAD', option);
    const [id, an, ae, ci, s] = detail?.split('\0') || [];

    commit = { id, time: dateToStr(ci) };
    if (option?.showAuthor) {
      commit.author = { name: an, email: ae };
    }
    if (option?.showMessage) {
      commit.message = s;
    }
  } catch {
    //
  }

  return commit;
}

/**
 * version info
 * @param option
 * @returns
 */
export function buildGitVersion(option?: Option) {
  let info = {
    build: {
      time: dateToStr(undefined, option?.timeZone),
    },
    git: {
      branch: branchInfo(option),
      commit: commitInfo(option),
    },
  };

  // multi repos
  const { multiRepo = false, repos = [], ...restOption } = option || {};
  if (multiRepo) {
    // remove git info
    Object.assign(info, { git: undefined });

    // repos
    for (const repo of repos) {
      if (repo.name && repo.cwd) {
        Object.assign(restOption, { cwd: repo.cwd });
        Object.assign(info, {
          [repo.name]: {
            branch: branchInfo(restOption),
            commit: commitInfo(restOption),
          },
        });
      }
    }
  }

  if (option && Object.prototype.toString.call(option?.extra) === '[object Object]') {
    info = { ...info, ...option.extra };
  }

  return info;
}
