// config/Initializers.ts
import { processArgs } from "../helpers/process_args.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/Logger.js";

const ENVIRONMENT = {
  production: "production",
  test: "test",
  development: "development",
};

const initializeApplication = () => {
  try {
    const processedArgs = processArgs();
    setEnvironment(processedArgs.env);
    logger.info(`Environment is set to ${processedArgs.env}`);
    configureDotEnvironment(processedArgs.env);
    logger.info(`Env. variables are set.`);
  } catch (error) {
    logger.error(`Env. variables could not be set: ${error}`);
    process.exit(0);
  }
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

  logger.log(`Loading env. variables from ${envPath}`);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(
      "Dot environment could not be configured. \n" + result.error
    );
  }

  // Append to process.env
  for (const key in result.parsed) {
    process.env[key] = result.parsed[key];
  }
};

export default initializeApplication;
