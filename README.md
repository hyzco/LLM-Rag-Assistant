# LLM-Rag-Application

Simple implementation of Langchain on Ollama, AI tools(like OpenAI tools but different :P), vector store, socket server !

## Running locally

1. Clone the repo and install dependencies:

    ```bash
    git clone https://github.com/hyzco/LLM-Rag-Application.git
    cd LLM-Rag-Application
    npm install
    ```
2. Rename .env.development.example to .env.development
   Using https://astra.datastax.com/ for free Cassandra Vector DB host
   Using https://www.weatherapi.com/ for free Weather API.
   
3. Run the development server:

    ```bash
    npm run start
    ```
    > Firefox users need to change the `dom.workers.modules.enabled` setting in `about:config` to `true` to enable Web Workers.
    > Check out [this issue](https://github.com/xenova/whisper-web/issues/8) for more details.

4. Socket server will run on ws://localhost:8080
   This important, [Front End](https://github.com/hyzco/TTS-Assistant/) using it.

## Running backend RAG application, to be able to chat with LLM, get real time weather information by given location, taking notes, and retrieving it from the Cassandra vector store.
Check out repo for UI with TTS feature: 
https://github.com/hyzco/TTS-Assistant/
