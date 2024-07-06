// jest.config.ts
import type { JestConfigWithTsJest } from "ts-jest";
// import initializeApplication from "./src/config/Initializers";
// initializeApplication();
const jestConfig: JestConfigWithTsJest = {
  // [...]
  setupFiles: ["dotenv/config"],

  transform: {
    // '^.+\\.[tj]sx?$' //to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    // "^.+\\.tsx?$"
    '^.+\\.[tj]sx?$':[
      "ts-jest",
      {
        // ts-jest configuration goes here
        tsconfig: "./tsconfig.json",
      },
    ],
  },
};
export default jestConfig;
