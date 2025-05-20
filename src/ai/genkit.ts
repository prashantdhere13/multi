import {genkit} from 'genkit';
// import {ollama} from '@genkit-ai/ollama'; // Package not found, ensure this is correct if needed

export const ai = genkit({
  plugins: [
    // ollama({ // Package @genkit-ai/ollama not found. This plugin is disabled.
    //   // Ensure Ollama is running and accessible.
    //   // Default serverAddress is http://localhost:11434
    //   // You can specify a custom address if needed:
    //   // serverAddress: 'http://custom.ollama.host:port'
    // }),
  ],
  // Update this to the specific Llama model you have pulled in Ollama, e.g., 'ollama/llama3', 'ollama/llama2'
  // Make sure the model is available in your Ollama setup.
  // model: 'ollama/llama3', // Disabled as the ollama plugin providing it is not available
});
