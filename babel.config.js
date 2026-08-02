module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // Keeps Hermes happy
    plugins: [
      [
        "module:react-native-dotenv", // Resolves your @env imports
        {
          moduleName: "@env",
          path: ".env",
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
