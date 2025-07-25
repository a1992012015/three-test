import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  ...compat.plugins("prettier", "import"),
  {
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      semi: ["error", "always"],
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
          ],
          "newlines-between": "always",
        },
      ],
      "@typescript-eslint/no-require-imports": [
        "error",
        {
          allow: ["path", "fs", "tailwindcss-animate", "workbox-webpack-plugin"],
        },
      ],
    },
  },
];

export default eslintConfig;
