const processArgs = (args = process.argv.slice(2)) => {
    // Create a map to store the parsed arguments
    const parsedArgs:any = {};
  
    // Loop through the arguments array
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
  
      // Check if the argument starts with '--env='
      if (arg.startsWith('--env=')) {
        // Extract the environment value from the argument
        const envValue = arg.substring('--env='.length);
  
        // Store the environment variable in the parsedArgs object
        parsedArgs.env = envValue.toLowerCase();
        break; // Exit the loop once we find the environment variable
      }
    }
  
    return parsedArgs;
  };
  
  export { processArgs }