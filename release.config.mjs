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
    }],
    ['@semantic-release/npm', {
      npmPublish: true,
    }],
    ['@semantic-release/github', {
      successComment: false,
      failComment: false,
    }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],
  ],
};
