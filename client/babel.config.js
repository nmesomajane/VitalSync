module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
   plugins: [
  ["@babel/plugin-transform-private-methods", { loose: true }],
  ["@babel/plugin-transform-shorthand-properties", { loose: true }]
]
  };
};