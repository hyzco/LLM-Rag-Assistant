// config/Initializers.ts
import { processArgs } from "../helpers/process_args.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const ENVIRONMENT = {
  production: "production",
  test: "test",
  development: "development",
};

const initializeApplication = () => {
  const processedArgs = processArgs();
  setEnvironment(processedArgs.env);
  configureDotEnvironment(processedArgs.env);
};

const setEnvironment = (env: string) => {
  if (!ENVIRONMENT[env]) {
    throw new Error("Invalid environment: " + env);
  }
  process.env.NODE_ENV = env;
};

const configureDotEnvironment = (env: string) => {
  const dotEnvFile = `.env.${env}`;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, `../../${dotEnvFile}`);

  console.log(`Loading environment variables from ${envPath}`);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error("Dot environment could not be configured - error: " + result.error);
  }

  // Append to process.env
  for (const key in result.parsed) {
    process.env[key] = result.parsed[key];
  }

  console.log(`Loaded environment variables: ${JSON.stringify(result.parsed, null, 2)}`);
};

export default initializeApplication;
