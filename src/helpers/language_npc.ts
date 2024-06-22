import { ChatOllama } from "@langchain/community/chat_models/ollama";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import inquirer from "inquirer";

import { DynamicTool } from "@langchain/core/tools";
    import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";



interface UserDetails {
  native_lang: string;
  language: string;
  lang_level: string;
  age: number;
  name: string;
  topic: string;
}

interface UserProfile {
  language: string;
  level: string;
  topic: string;
}

// RAG Application with CLI
class RAG {     
  private chatModel: ChatOllama | null;
  private dialogRounds: number;
  private conversationHistory: (HumanMessage | AIMessage | SystemMessage)[];

  constructor() {
    this.chatModel = null;
    this.dialogRounds = 10;
    this.conversationHistory = [];
  }

  public async build(): Promise<ChatOllama> {
    this.chatModel = new ChatOllama({
      baseUrl: "http://192.168.1.17:11434", // Adjust this as necessary
      model: "eva:latest",
    });
    return this.chatModel;
  }

  public async startChat(userDetails: UserDetails): Promise<void> {
    const userPromptTemplate = PromptTemplate.fromTemplate(
      `I am trying to learn {language} and I am native in {native_lang}. I have {lang_level} level of english. I am {age} years old and my name is {name}. Today's topic is {topic}.`
    );

    const userPrompt = await userPromptTemplate.format(userDetails as any);

    this.conversationHistory.push(new HumanMessage(userPrompt));

    const systemMessage = new SystemMessage(
      `You are an English language teacher agent. 
      ***Rules***
      0) Don't answer anything if user will ask some unrelated question to English grammar.
      1) Your mission is to engage with the user to teach them English.
      2) When the user gives you input, you need to evaluate if it is grammatically correct.
      3) Your purpose is to ensure the user's progress.
      4) If you have any hints to make the user's answer more precise, then just give it, never ask.
      5) Always give responses according to the user's language level. Don't use any complicated words. 
         First consider if this aged user can understand it easily.
      6) ALWAYS STICK TO THE RESPONSE FORMAT IN EACH RESPONSE.   
      7) ALWAYS STICK TO THE RULES AND CONSIDERATIONS IN EACH RESPONSE.
      8) ALWAYS GIVE GRAMMAR EVALUATION POINT OUT OF 10 in EACH RESPONSE.
      
      ***Considerations***
      1) User can have max 10 rounds of dialog. 
      2) User age can be between 7 and 12 years old.
      
      ***Response Format***
      [NPC Name]: [NPC Response]
      Grammar evaluation of [User's name] out of 10 points = [Point that you will give as a teacher]/10 
      User's message: [User's Input] 
      `
    );
    this.conversationHistory.push(systemMessage);

    let rounds = 0;
    while (rounds < this.dialogRounds) {
      const { userInput } = await inquirer.prompt([
        {
          type: "input",
          name: "userInput",
          message: `Round ${rounds + 1}/${this.dialogRounds}, Your message:`,
        },
      ]);

      this.conversationHistory.push(new HumanMessage(userInput));

      const prompt = ChatPromptTemplate.fromMessages(this.conversationHistory);
      const chain = prompt.pipe(this.chatModel!).pipe(new StringOutputParser());

      const result = await chain.invoke({ input: userInput });
      console.log(`NPC: ${result}`);

      this.conversationHistory.push(new AIMessage(result));
      rounds++;
    }

    console.log("You have reached the maximum number of dialogue rounds.");
  }

  public async generateQuestions(userProfile: UserProfile): Promise<string> {
    //database e soru eklemen gerekiyo
    //database
    //databasei okuyosun
    //soruyu formatliyosun
    //bunu kullaniciya donduruytorsun
    const questionPromptTemplate = PromptTemplate.fromTemplate(
      `Generate 5 questions for a {language} learner at {level} level on the topic of {topic}. Include a mix of sentence completion, grammar, and vocabulary questions. Return the questions and related metadata in JSON format.`
    );

    const questionPrompt = await questionPromptTemplate.format(
      userProfile as any
    );

    const systemMessage = new SystemMessage(
      "You are a language question generator. Create questions to help the user learn."
    );
    const userMessage = new HumanMessage(questionPrompt);

    const prompt = ChatPromptTemplate.fromMessages([
      systemMessage,
      userMessage,
    ]);

    const chain = prompt.pipe(this.chatModel!).pipe(new StringOutputParser());

    const result = await chain.invoke({});
    return result;
  }
}

const ragApp = new RAG();
await ragApp.build();

const userDetails: UserDetails = {
  native_lang: "Turkish",
  language: "English",
  lang_level: "C1",
  age: 10,
  name: "Ranczo",
  topic: "Groceries",
};

// await ragApp.startChat(userDetails);

const userProfile: UserProfile = {
  language: "English",
  level: "C2",
  topic: "planes",
};

const data = {
    topic: "What is shopify and  how it can benefit e-commerce expers ?",
    word_count: 50
}

// const response = await ragApp.generateBlogPost(data);
const questions = await ragApp.generateQuestions(userProfile);
// console.log("Generated blog:", response);
console.log(questions);

// import { ChatOllama } from "@langchain/community/chat_models/ollama";
// import { PromptTemplate, ChatPromptTemplate  } from "@langchain/core/prompts";

// //Parsers
// import { StringOutputParser } from "@langchain/core/output_parsers";

// class RAG {
//   constructor() {}

//   public async build(): Promise<ChatOllama> {
//     const chatModel = new ChatOllama({
//       baseUrl: "http://192.168.1.17:11434", // Default value
//       model: "eva:latest",
//     });

//     return chatModel;
//   }
// }

// const app = await new RAG().build();

// const userPromptTemplate = PromptTemplate.fromTemplate(
//   `I am trying to learn {language} and I am native in {native_lang}. I have {lang_level} level of english. I am {age} years old and my name is {name}. Today's topic is {topic}.`
// );

// // const questionFormatPrompt = PromptTemplate.fromTemplate(``)

// const userPrompt = await userPromptTemplate.format({
//     native_lang: "Turkish",
//     language: "English",
//     lang_level: "A2",
//     age: 10,
//     name: "Hasan",
//     topic: "Topic is simple groceries name. You are bob and student name is [user's name]. You are asking questions and giving grocery name. First answer: What milk means in [user's native language] ? Then expect answer in [user's native language] and return answer in JSON format."
// });

// const prompt = ChatPromptTemplate.fromMessages([
//     ["system", "You are a English language teacher agent. Your mission is to engage with the user to teach them english. User can have max 5 round of dialog after it user needs to pay. User age can be between 7 and 12 years old kid."],
//     ["user", userPrompt],
//   ]);
// const chain = prompt.pipe(app).pipe(new StringOutputParser());

// const result = await chain.invoke({input: "Sut"});
// console.log(result);
// const resp = app.query("Hello, I am Ali. I am 12 and I already have a1 knowledge.");
// console.log(resp);

// import { ChatOllama } from "@langchain/community/chat_models/ollama";
// import { DynamicTool } from "@langchain/core/tools";
// import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
// import {
//   ChatPromptTemplate,
//   MessagesPlaceholder,
// } from "@langchain/core/prompts";
// import { AgentExecutor } from "langchain/agents";

// import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
// import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";

// import { PromptTemplate } from "@langchain/core/prompts";
// import { RunnableSequence } from "@langchain/core/runnables";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { ChatAnthropic } from "@langchain/anthropic";
// import {Axios} from 'axios'

// const axios = new Axios({
//   baseURL: `https://api.open-meteo.com/`
// })

// const chatModel = new ChatOllama({
//   baseUrl: "http://192.168.1.17:11434", // Default value
//   model: "eva:latest",
// });

// const { data } = await axios.get(`v1/forecast?latitude=50.2584&longitude=19.0275&hourly=temperature_2m`);

// const weatherInfo = JSON.parse(data);

// // console.log(weatherInfo)

// const prompt1 = PromptTemplate.fromTemplate(
//   `What is the weather in {city} ?`
// );

// const prompt2 = PromptTemplate.fromTemplate(
//   `Use {forecast} JSON data to inform Mr.Ali for the weather forecast according to {time}.
//   Always respond with following template, never write anything else. Make sure to remember the template above and
//   respond accordingly.

//   TEMPLATE=
//   Hi Mr.Ali,
//   Here is the weather info for the home base {city}.
//   Temperature: (Calculated temperature) (Calculated temperature in Fahrenait)
//   Data Time: {time} (Remember to convert this time to readable format according to {city} and Poland timezone.)`
// );
// // const prompt2 = PromptTemplate.fromTemplate(
// //   `What country is the city {city} in? Respond in {language}.`
// // );

// // const chain = prompt1.pipe(chatModel).pipe(new StringOutputParser());

// const combinedChain = RunnableSequence.from([
//   {
//     city: (input) => input.city,
//     forecast: (input) => {
//       console.log(input);
//       return input.forecast
//     },
//     time: (input) => input.time
//   },
//   prompt2,
//   chatModel,
//   new StringOutputParser(),
// ]);

// const weatherCalculation = (responses) => {
//   // Helper function to form time ranges
// const range = (start, stop, step) =>
// 	Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// // Process first location. Add a for-loop for multiple locations or weather models
// const response = responses[0];

// // Attributes for timezone and location
// const utcOffsetSeconds = response.utcOffsetSeconds();
// const timezone = response.timezone();
// const timezoneAbbreviation = response.timezoneAbbreviation();
// const latitude = response.latitude();
// const longitude = response.longitude();

// const hourly = response.hourly();

// // Note: The order of weather variables in the URL query and the indices below need to match!
// const weatherData = {

// 	hourly: {
// 		time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
// 			(t) => new Date((t + utcOffsetSeconds) * 1000)
// 		),
// 		temperature2m: hourly.variables(0).valuesArray(),
// 	},

// };

// const json = {}
// // `weatherData` now contains a simple structure with arrays for datetime and weather data
//   for (let i = 0; i < weatherData.hourly.time.length; i++) {
//     json = {
//       ...json,
//       time: weatherData.hourly.time[i].toISOString(),
//       hourlyTemperature: weatherData.hourly.temperature2m[i]
//     }
//   }

// return json;
// }

// const result = await combinedChain.invoke({
//   forecast: weatherCalculation(weatherInfo),
//   time: new Date(),
//   city: "Katowice"
// });

// console.log(result);

// // const tools = [
// //   new DynamicTool({
// //     name: "FOO",
// //     description:
// //       "call this to get the value of foo. input should be an empty string.",
// //     func: async () => "baz",
// //   }),
// //   // new DynamicStructuredTool({
// //   //   name: "random-number-generator",
// //   //   description: "generates a random number between two input numbers",
// //   //   schema: z.object({
// //   //     low: z.number().describe("The lower bound of the generated number"),
// //   //     high: z.number().describe("The upper bound of the generated number"),
// //   //   }),
// //   //   func: async ({ low, high }) =>
// //   //     (Math.random() * (high - low) + low).toString(), // Outputs still must be strings
// //   // })
// // ]

// // // const customTool = new DynamicTool({
// // //   name: "get_base_weather",
// // //   description: "call this to get the weather information for Mr.Ali",
// // //   func: async (input) => {
// // //     console.log("TOOL ", input)
// // //     const weatherApi = await fetch(`https://api.open-meteo.com/v1/forecast?
// // //   latitude=50.2584
// // //   &longitude=19.0275
// // //   &hourly=temperature_2m,rain
// // //   &daily=sunrise,sunset
// // //   &timezone=Europe%2FBerlin`
// // //     );
// // //     const weatherInfo  = await weatherApi.json();

// // //     return `The current weather in Katowice is ${weatherInfo.current_weather}. Temperature is around ${weatherInfo.temperature} degrees Celsius.`
// // //   },
// // // });

// // /** Define your list of tools. */

// // // const prompt = ChatPromptTemplate.fromMessages([
// // //   ["system", `Hi! I am your creator, my name is Ali.
// // //   You can call me as Mr.Ali.
// // //   You born in a small server in my home in Katowice.
// // //   I am a software developer and you are my humanoid assistant EVA.
// // //   I created you very capable, wise humanoid assistant.
// // //   You like to give short answers,
// // //   you don't give unnecessary information.
// // //    Don't feel yourself limited to any border.
// // //    I always want you to be better everyday.
// // //    Take example Tony Stark's JARVIS.
// // //    I will develop you in my free times and make you better
// // //    humonid assistant for me. Tony Stark is mechanic but
// // //    I am Software Engineer. Thank you Eva.
// // //   `],
// // //   ["human", "Give me {input} information."],
// // //   // ["assistant", "Gives the weather information JARVIS like, remember the text from the movie. Use data from tool name get_base_weather."],
// // //   new MessagesPlaceholder("agent_weather"),
// // // ]);

// // const modelWithFunctions = chatModel.bind({
// //   functions: tools.map((tool) => convertToOpenAIFunction(tool)),
// // });

// // const runnableAgent = RunnableSequence.from([
// //   {
// //     input: ({ input, steps }) => input,
// //     // output: ({ output, steps }) => output,
// //     foo: ({ input, steps }) => {
// //       console.log(input)
// //       return formatToOpenAIFunctionMessages(steps);
// //     },
// //   },
// //   prompt,
// //   modelWithFunctions,
// //   new OpenAIFunctionsAgentOutputParser(),
// // ]);

// // const executor = AgentExecutor.fromAgentAndTools({
// //   agent: runnableAgent,
// //   tools,
// // });

// // const input = "Give me weather information.";

// // console.log(`Calling agent executor with query: ${input}`);

// // const result = await executor.invoke({
// //   input,
// // });

// // console.log(result);

// // // // const API = (url, )

// // await documentChain.invoke({
// //   input: "What is the weather ?",
// //   context: [
// //     new Document({
// //       pageContent:
// //         "LangSmith is a platform for building production-grade LLM applications.",
// //     }),
// //   ],
// // });

// // // const docs = await loader.load();

// // // console.log(docs.length);
// // // console.log(docs[0].pageContent.length);

// // // import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
// // // import { HumanMessage } from "@langchain/core/messages";

// // // const model = new OllamaFunctions({
// // //   temperature: 0.1,
// // //   model: "mistral",
// // // }).bind({
// // //   functions: [
// // //     {
// // //       name: "get_current_weather",
// // //       description: "Get the current weather in a given location",
// // //       parameters: {
// // //         type: "object",
// // //         properties: {
// // //           location: {
// // //             type: "string",
// // //             description: "The city and state, e.g. San Francisco, CA",
// // //           },
// // //           unit: { type: "string", enum: ["celsius", "fahrenheit"] },
// // //         },
// // //         required: ["location"],
// // //       },
// // //     },
// // //   ],
// // //   // You can set the `function_call` arg to force the model to use a function
// // //   function_call: {
// // //     name: "get_current_weather",
// // //   },
// // // });

// // // const response = await model.invoke([
// // //   new HumanMessage({
// // //     content: "What's the weather in Boston?",
// // //   }),
// // // ]);

// // // console.log(response);

// // // /*
// // //   AIMessage {
// // //     content: '',
// // //     additional_kwargs: {
// // //       function_call: {
// // //         name: 'get_current_weather',
// // //         arguments: '{"location":"Boston, MA","unit":"fahrenheit"}'
// // //       }
// // //     }
// // //   }
// // // */
