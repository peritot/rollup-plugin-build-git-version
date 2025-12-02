import simpleGit from 'simple-git';
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
async function branchInfo(option?: Option) {
  let branch = '';

  try {
    const git = simpleGit({ baseDir: option?.cwd });

    try {
      const summary = await git.branch();
      branch = summary?.current || '';
    } catch {}

    if (!branch) {
      try {
        const res = await git.raw(['rev-parse', '--abbrev-ref', 'HEAD']);
        branch = res.toString().trim();
      } catch {}
    }

    if (!branch) {
      try {
        const res = await git.raw(['name-rev', '--name-only', 'HEAD']);
        branch = res.toString().trim();
        if (branch) {
          branch = branch.replace(/(^remotes\/)?(origin\/)?(tags\/)?(\^\d*$)?/g, '');
        }
      } catch {}
    }
  } catch {}

  return branch;
}

/**
 * get commit info
 */
async function commitInfo(option?: Option) {
  let commit: CommitInfo = {};

  try {
    const git = simpleGit({ baseDir: option?.cwd });

    const log = await git.log({ maxCount: 1 });
    const latest = log.latest;
    commit = {
      id: latest?.hash || '',
      time: dateToStr(latest?.date),
    };
    if (option?.showAuthor) {
      commit.author = {
        name: latest?.author_name || '',
        email: latest?.author_email || '',
      };
    }
    if (option?.showMessage) {
      commit.message = latest?.message;
    }
  } catch {}

  return commit;
}

/**
 * version info
 * @param option
 * @returns
 */
export async function buildGitVersion(option?: Option) {
  let info = {
    build: {
      time: dateToStr(undefined, option?.timeZone),
    },
    git: {
      branch: await branchInfo(option),
      commit: await commitInfo(option),
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
            branch: await branchInfo(restOption),
            commit: await commitInfo(restOption),
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
