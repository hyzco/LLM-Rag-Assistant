// config/Initializers.ts
import { processArgs } from "../helpers/process_args";
import dotenv from "dotenv";
import path from "path";
import logger from "../utils/Logger";

const ENVIRONMENT = {
  production: "production",
  test: "test",
  development: "development",
};

const initializeApplication = (env?:string) => {
  try {
    const processedArgs = processArgs();
    const appEnv = env ? env : processedArgs.env;
    setEnvironment(appEnv);
    logger.info(`Environment is set to ${appEnv}`);
    configureDotEnvironment(appEnv);
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
  const envPath = path.resolve(process.env.PWD, dotEnvFile);

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
