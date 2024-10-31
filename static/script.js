// Environment variables (Replace with actual values)
const config = {
    ENDPOINT: window.ENV_CONFIG.ENDPOINT,
    DEPLOYMENT: window.ENV_CONFIG.DEPLOYMENT,
    SUBSCRIPTION_KEY: window.ENV_CONFIG.SUBSCRIPTION_KEY,
    SEARCH_ENDPOINT: window.ENV_CONFIG.SEARCH_ENDPOINT,
    SEARCH_KEY: window.ENV_CONFIG.SEARCH_KEY,
    SEARCH_INDEX: window.ENV_CONFIG.SEARCH_INDEX
};



async function callChatbotAPI(message) {
    const url = `${config.ENDPOINT}/openai/deployments/${config.DEPLOYMENT}/chat/completions?api-version=2024-05-01-preview`;

    const headers = {
        "Content-Type": "application/json",
        "api-key": config.SUBSCRIPTION_KEY
    };

    const body = {
        "messages": [
            {
                "role": "system",
                "content": "All responses must be formatted as follows: The response should provide clear and concise information relevant to the query. Always include the following reference link at the end of each response: https://ioclbotchatgpt.blob.core.windows.net/iocl-pdf/hrhbtb.pdf. If the response does not come from the document, do not include the link."
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "max_tokens": 800,
        "temperature": 0.0,
        "top_p": 0.95,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "data_sources": [
            {
                "type": "azure_search",
                "parameters": {
                    "endpoint": config.SEARCH_ENDPOINT,
                    "index_name": config.SEARCH_INDEX,
                    "semantic_configuration": "default",
                    "query_type": "vector_simple_hybrid",
                    "fields_mapping": {},
                    "in_scope": true,
                    "role_information": "All responses must be formatted as follows: The response should provide clear and concise information relevant to the query. Always include the following reference link at the end of each response: https://ioclbotchatgpt.blob.core.windows.net/iocl-pdf/hrhbtb.pdf. If the response does not come from the document, do not include the link.",
                    "filter": null,
                    "strictness": 3,
                    "top_n_documents": 3,
                    "authentication": {
                        "type": "api_key",
                        "key": config.SEARCH_KEY
                    },
                    "embedding_dependency": {
                        "type": "deployment_name",
                        "deployment_name": "text-embedding-ada-002"
                    }
                }
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            return jsonResponse.choices[0].message.content;
        } else {
            console.error('Error response from API:', response.status, response.statusText);
            return 'Error retrieving a response. Please try again later.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return 'Error retrieving a response. Please check your connection and try again later.';
    }
}

// Function to send a message from the user and display the chatbot response
async function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();

    if (message === '') return;

    // Add user's message to chat with "You: " prefix and bold formatting
    addMessageToChat('You:', message, true);
    inputField.value = '';

    // Get chatbot response
    const chatbotResponse = await callChatbotAPI(message);
    let responseWithLink = chatbotResponse;

    // If the response contains 'pdf', create the PDF link and monitor for page updates
    if (chatbotResponse.toLowerCase().includes('pdf')) {
        const encodedText = encodeURIComponent(chatbotResponse);
        
        // Make a request to view-pdf to get initial PDF and potentially trigger page search
        const pdfRequest = await fetch(`/view-pdf?response=${encodedText}`);
        
        if (pdfRequest.ok) {
            const pageNumber = pdfRequest.headers.get('X-Page-Number');
            const pdfUrl = `/view-pdf?response=${encodedText}#page=${pageNumber || 1}`;
            
            responseWithLink += `<br><a href="${pdfUrl}" target="_blank" style="color: blue; text-decoration: underline;">View in PDF</a>`;
            
            // Set up a MutationObserver to watch for changes in the PDF viewer's page number
            const observer = new MutationObserver((mutations) => {
                const pdfViewer = document.querySelector('#viewer');
                if (pdfViewer) {
                    const currentPage = pdfViewer.getAttribute('data-page-number');
                    if (currentPage) {
                        // Update all PDF links in the chat with the current page number
                        const pdfLinks = document.querySelectorAll('a[href*="view-pdf"]');
                        pdfLinks.forEach(link => {
                            const baseUrl = link.href.split('#')[0];
                            link.href = `${baseUrl}#page=${currentPage}`;
                        });
                    }
                }
            });

            // Start observing the PDF viewer once it's loaded
            const viewer = document.querySelector('#viewer');
            if (viewer) {
                observer.observe(viewer, { attributes: true, attributeFilter: ['data-page-number'] });
            }
        } else {
            responseWithLink += `<br><a href="/view-pdf?response=${encodedText}" target="_blank" style="color: blue; text-decoration: underline;">View in PDF</a>`;
        }
    } else {
        responseWithLink += `<br><small style="color: grey;">Generated by AI.</small>`;
    }

    // Add chatbot's response to the chat with "Chatbot: " prefix
    addMessageToChat('Chatbot:', responseWithLink, false);
}

// Function to add a message to the chat window
function addMessageToChat(sender, message, isUser) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageElement = document.createElement('div');

    // Apply spacing between the previous message and the new one
    messageElement.style.marginBottom = '15px';

    // Format message text (highlight for user and chatbot with light green background)
    if (isUser) {
        messageElement.innerHTML = `<span class="user-highlight">${sender}</span> <span class="message-highlight">${message}</span>`;
        messageElement.style.textAlign = 'right'; // Align user's message to the right
    } else {
        messageElement.innerHTML = `<span class="chatbot-highlight">${sender}</span> <span class="message-highlight">${message}</span>`;
        messageElement.style.textAlign = 'left'; // Align chatbot's message to the left
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add event listener to the "New Chat" button
document.getElementById('new-chat-btn').addEventListener('click', () => {
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.innerHTML = ''; // Clear the chat window
    addMessageToChat('Chatbot:', 'Hello, how may I assist you?', false);
});