const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  outputDir: "dist",
  publicPath: process.env.NODE_ENV === "production" ? "" : "/",
  transpileDependencies: true,
  devServer: {
    host: "localhost",
    port: 8080,
    open: true,
  },
});
