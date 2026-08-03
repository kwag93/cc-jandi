/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main'],
  repositoryUrl: 'https://github.com/kwag93/cc-jandi.git',
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'angular',
      releaseRules: [
        { type: 'docs', release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { type: 'style', release: 'patch' },
        { type: 'perf', release: 'patch' },
      ],
    }],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      // Without a title the generator prepends to the very top of the file, which
      // pushed the document heading down below each release. Pinning it here keeps
      // the heading in place and inserts new releases underneath it.
      changelogTitle: '# Changelog\n\n이 프로젝트의 주요 변경사항을 기록합니다. 버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따르며, 1.0.1 이후 항목은 커밋 이력에서 [semantic-release](https://semantic-release.gitbook.io/)가 자동 생성합니다.',
    }],
    ['@semantic-release/npm', {
      npmPublish: true,
    }],
    // Claude Code reads the plugin version from its own manifest, so keep it in step
    // with package.json or plugin users never see the release.
    ['@semantic-release/exec', {
      prepareCmd: 'node scripts/sync-version.mjs ${nextRelease.version}',
    }],
    ['@semantic-release/github', {
      successComment: false,
      failComment: false,
    }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json', '.claude-plugin/plugin.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],
  ],
};
