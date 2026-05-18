/** @type {import('vitest/config').UserConfig} */
module.exports = {
  root: __dirname,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
};
