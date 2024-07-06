If you clone and you like, please don't forget to give me star! ⭐⭐⭐⭐⭐ Feel free to start a discussion ! :)

# LLM-Rag-Application

Dynamic implementation of Langchain using Ollama, AI tools, a vector store, and a socket server!
#### Vision: 
Target point is to reach a level where this software will be dynamic RAG application crafter, with custom AI tools. It should be generic however with specific use case templates to create LLM applications with less effort.

#### Current Point:
Before reaching the target point, I am implementing Virtual Assistant which have multiple tools to retrieve real informations. Then I will evolve it to `Vision` point.

## Overview

The LLM-Rag-Application leverages the power of Langchain to provide functionalities such as chatting with LLMs, getting real-time weather information, taking notes, and retrieving them from a Cassandra vector store. The application also includes a socket server for real-time interactions.

## Features

- **LLM Chat**: Engage in conversations with the LLM.
- **Real-time Weather and Time Information**: Fetch weather data based on location. Retrieve localized time.
- **Note Management**: Take and store notes in a Cassandra vector store.
- **Socket Server**: Real-time interaction capability with the frontend.

## Prerequisites

- Node.js and npm installed.
- Access to [astra.datastax.com](https://astra.datastax.com/) for a free Cassandra Vector DB host.
- Access to [WeatherAPI](https://www.weatherapi.com/) for a free Weather API key.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hyzco/LLM-Rag-Application.git
cd LLM-Rag-Application
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Configure Environment Variables
Rename `.env.development.example` to `.env.development` and update it with your credentials and API keys.

### 4. Run the Development Server
```bash
npm run start
```
### 5. Socket Server
The socket server will run on `ws://localhost:8080`. This is crucial as the frontend relies on it.

Frontend
Check out the [TTS-Assistant ](https://github.com/hyzco/TTS-Assistant) repository for a UI with TTS (Text-To-Speech) features. 

Usage
Running the backend RAG application enables you to:

- Chat with the LLM.
- Fetch real-time weather information based on the provided location.
- Manage notes and store them in the Cassandra vector store.

## Setting Up

### 1. Obtain API Keys and Credentials
- Sign up at [WeatherAPI](https://www.weatherapi.com/) to get the `WEATHER_API_KEY`.
- Register at [astra.datastax.com](https://astra.datastax.com/) to get the `CASSANDRA_CLIENT_ID`, `CASSANDRA_SECRET`, `CASSANDRA_TOKEN`, `ASTRA_DB_UNAME`, and `ASTRA_DB_PW`.

### 2. Update `.env.development` File
- Rename `.env.development.example` to `.env.development`.
- Fill in the variables with the appropriate values obtained from the steps above.


### Explanation of environment variables

#### WEATHER_API_ENDPOINT
- **Description**: The base URL for the WeatherAPI service.
- **Example**: `https://api.weatherapi.com/v1/`
- **Usage**: This URL is used as the endpoint to fetch weather data.

#### WEATHER_API_KEY
- **Description**: The API key for accessing the WeatherAPI service.
- **Usage**: This key is required for authenticating requests to the WeatherAPI service.

#### OLLAMA_HOST
- **Description**: The base URL for the Ollama service.
- **Example**: `http://192.168.1.17:11434`
- **Usage**: This URL is used to access the Ollama service for embeddings and other AI functionalities.

#### DEFAULT_MODEL
- **Description**: The default model name for the Ollama embeddings.
- **Example**: `llama3`
- **Usage**: Specifies which model to use for generating embeddings.

#### CASSANDRA_HOST
- **Description**: The endpoint for the Cassandra database host.
- **Usage**: Used to connect to the Cassandra database service.

#### CASSANDRA_CLIENT_ID
- **Description**: The client ID for authenticating with the Cassandra database.
- **Usage**: Required for authentication with the Cassandra service.

#### CASSANDRA_SECRET
- **Description**: The secret key for authenticating with the Cassandra database.
- **Usage**: Used in conjunction with the client ID to authenticate with the Cassandra service.

#### CASSANDRA_TOKEN
- **Description**: The token for accessing the Cassandra database.
- **Usage**: An additional layer of authentication for accessing the Cassandra service.

#### ASTRA_DB_UNAME
- **Description**: The username for accessing the Astra DB.
- **Usage**: Used for authenticating with the Astra DB service.

#### ASTRA_DB_PW
- **Description**: The password for accessing the Astra DB.
- **Usage**: Used in conjunction with the username to authenticate with the Astra DB service.

## TO-DO:
1. UNIT TESTS !!
1. Endpoint to create tools dynamically with given parameters.
2. Improve Note Tool (Use CRUD and compare performance with inserting JSON Document.
3. Find a way to implement XTTs V2 streaming.
4. Support different Embedding providers.
5. Implement HuggingFace to retrieve model and execute locally for `ChatModel`.

## Contributing
Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

### License
This project is licensed under the MIT License.
