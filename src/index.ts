import type { Plugin } from 'rollup';
import { buildGitVersion, type Option } from './utils';

/**
 * Add version.json to dist
 * @public
 */
function buildGitVersionPlugin(option?: Option): Plugin {
  return {
    name: 'rollup-plugin-build-git-version',
    async buildEnd() {
      try {
        const { fileName = 'version.json', ...op } = option || {};

        const info = await buildGitVersion(op);
        const source = JSON.stringify(info, undefined, 4);

        this.emitFile({
          type: 'asset',
          fileName,
          source,
        });
      } catch (error) {
        console.log('rollup-plugin-build-git-version error', error);
      }
    },
  };
}

export { buildGitVersion, buildGitVersionPlugin, Option as BuildGitVersionPluginOption };
