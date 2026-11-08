// Jest compiles everything to CommonJS, where `import.meta` does not parse.
// React Router 8 ships only ES modules and reads `import.meta.hot` in one
// Framework Mode error branch, so under Jest `import.meta` becomes an empty
// object (its `.hot` is undefined). Babel runs only under Jest here; any
// other caller would get the config unchanged. babel-jest's cache key does
// not see this function's body: after editing it, run
// `pnpm exec jest --clearCache` once.
const importMetaAsObject = ({ types: t }) => ({
  name: "import-meta-as-object",
  visitor: {
    MetaProperty(path) {
      if (path.node.meta.name === "import")
        path.replaceWith(t.objectExpression([]));
    },
  },
});

module.exports = (api) => {
  const jestCommonJS = api.caller(
    (caller) => caller?.name === "babel-jest" && !caller.supportsStaticESM,
  );
  return {
    presets: [
      "@babel/preset-env",
      "@babel/preset-typescript",
      ["@babel/preset-react", { runtime: "automatic" }],
    ],
    plugins: jestCommonJS ? [importMetaAsObject] : [],
  };
};
