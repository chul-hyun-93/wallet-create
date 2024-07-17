const path = require("path");

module.exports = {
  overrides: [
    // config files
    {
      files: ["./{.*,*}.{js,cjs}"],
      parserOptions: {
        ecmaVersion: "latest",
      },
      extends: ["airbnb-base", "plugin:prettier/recommended"],
      env: {
        node: true,
      },
      rules: {
        "prettier/prettier": "error",
      },
    },
    // ts
    {
      files: ["./src/**/*.ts", "./src/**/*.d.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "airbnb-base",
        "airbnb-typescript/base",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
      ],
      parserOptions: {
        project: [path.resolve(__dirname, "./tsconfig.json")],
      },
      rules: {
        "prettier/prettier": "error",
        '@typescript-eslint/no-use-before-define': 'off',
        'no-continue': 'off',
        'no-plusplus': 'off',
        '@typescript-eslint/no-loop-func': 'off',
        'no-restricted-syntax': 'off',
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
      },
      env: {
        node: true,
      },
    },
    // js
    {
      files: ["./src/**/*.js"],
      extends: ["airbnb-base", "plugin:prettier/recommended"],
      parserOptions: {
        ecmaVersion: "latest",
      },
      rules: {
        "prettier/prettier": "error",
      },
      env: {
        node: true,
      },
    },
  ],
};
