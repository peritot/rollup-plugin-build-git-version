import { execSync } from 'child_process';
import { dateToStr } from './date';

/**
 * @public
 */
export interface Option {
  fileName?: string;
  showAuthor?: boolean;
  showMessage?: boolean;
  extra?: object;
}

/**
 * @public
 */
interface CommitInfo {
  id: string;
  time: string;
  author?: {
    name: string;
    email: string;
  };
  message?: string;
}

/**
 * get branch info
 */
function branchInfo() {
  let branch = '';

  try {
    branch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}').toString().trim();
  } catch {
    //
  }
  if (!branch) {
    try {
      branch = execSync('git name-rev --name-only HEAD').toString().trim();

      if (branch) {
        branch = branch.replace(/(^remotes\/)?(origin\/)?(tags\/)?(\^\d*$)?/g, '');
      }
    } catch {
      //
    }
  }
  if (!branch) {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
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
  let commit: CommitInfo | undefined;

  try {
    const id = execSync('git rev-parse HEAD').toString().trim();
    const detail = execSync('git --no-pager log --pretty=format:"%an-----%ae-----%ci-----%s" HEAD -1').toString().trim();
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
      time: dateToStr(),
    },
    git: {
      branch: branchInfo(),
      commit: commitInfo(option),
    },
  };

  if (Object.prototype.toString.call(option?.extra) === '[object Object]') {
    info = { ...info, ...this.options.extra };
  }

  return info;
}
