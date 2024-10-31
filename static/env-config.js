// First create a new file called env-config.js
// env-config.js
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env
dotenv.config();

// Create a JavaScript file that will expose the environment variables to the browser
const envConfigFile = `
window.ENV = {
    ENDPOINT: '${process.env.ENDPOINT}',
    DEPLOYMENT: '${process.env.DEPLOYMENT}',
    SUBSCRIPTION_KEY: '${process.env.SUBSCRIPTION_KEY}',
    SEARCH_ENDPOINT: '${process.env.SEARCH_ENDPOINT}',
    SEARCH_KEY: '${process.env.SEARCH_KEY}',
    SEARCH_INDEX: '${process.env.SEARCH_INDEX}'
};
`;

// Write the config to a file that will be included in the HTML
fs.writeFileSync('env-config.generated.js', envConfigFile);