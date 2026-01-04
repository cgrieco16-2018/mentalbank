const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Building Expo web app...");

if (fs.existsSync("static-build")) {
  fs.rmSync("static-build", { recursive: true });
}

try {
  execSync("npx expo export --platform web --output-dir static-build", {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
  
  console.log("Web build complete!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
