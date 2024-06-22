import { processArgs } from "../helpers/process_args.js";
import dotenv from "dotenv";
import path from 'path';

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

  process.env.ENVIRONMENT = env;
};

const configureDotEnvironment = (env: any) => {
  const dotEnvFile = `.env.${env}`;
  try {
    dotenv.config({ path: path.resolve(import.meta.dirname, `../../${dotEnvFile}`) })
  } catch (err) {
    throw new Error("Dot environment could not be configured - error: " + err);
  }
};

export default initializeApplication;