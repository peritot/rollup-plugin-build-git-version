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
 * get branch info
 */
function branchInfo(option?: Option) {
  let branch = '';

  try {
    branch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { cwd: option?.cwd })
      .toString()
      .trim();
  } catch {
    //
  }
  if (!branch) {
    try {
      branch = execSync('git name-rev --name-only HEAD', { cwd: option?.cwd })
        .toString()
        .trim();

      if (branch) {
        branch = branch.replace(/(^remotes\/)?(origin\/)?(tags\/)?(\^\d*$)?/g, '');
      }
    } catch {
      //
    }
  }
  if (!branch) {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: option?.cwd })
        .toString()
        .trim();
    } catch {
      //
    }
  }

  return branch;
}

/**
 * get commit info
 */
function commitInfo(option?: Option) {
  let commit: CommitInfo = {};

  try {
    const id = execSync('git rev-parse HEAD', { cwd: option?.cwd })
      .toString()
      .trim();
    const detail = execSync('git --no-pager log --pretty=format:"%an-----%ae-----%ci-----%s" HEAD -1', { cwd: option?.cwd })
      .toString()
      .trim();
    const [an, ae, ci, s] = detail?.split('-----') || [];

    commit = {
      id,
      time: dateToStr(ci),
    };
    if (option?.showAuthor) {
      commit.author = {
        name: an,
        email: ae,
      };
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
