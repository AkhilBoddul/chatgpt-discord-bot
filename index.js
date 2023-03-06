require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    organization: process.env.OPENAI_ORG,
    apiKey: process.env.OPENAI_KEY,
})
let openai = new OpenAIApi(configuration);

let conversations = {}; // Conversation history 

client.on('messageCreate', async function (message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    let messages = []; // Will contain current chat session

    // To clear conversation history
    if (message.content.startsWith('!clearhistory')) {
        conversations[userId] = [];
        await message.reply('Your conversation history has been cleared.');
        return;
    }

    // Check if previous history exists for this user
    if (conversations.hasOwnProperty(userId)) {
        messages = conversations[userId]; // Load previous chat history
    }
    // Append latest message to the list of messages
    messages.push({
        role: "user",
        content: `${message.author.username}: ${message.content}`,
    });
    console.log(messages)
    try {
        if (message.author.bot) return;
        const gptResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 1,
            max_tokens: 1024,
        })

        let responseText = gptResponse.data.choices[0].message.content;

        // To create separate messages for responses greater than 2000 characters.
        if (responseText) {
            const maxLength = 2000;

            while (responseText.length > maxLength) {
                const truncatedResponse = responseText.substring(0, maxLength);
                await message.reply(`${truncatedResponse}`);
                responseText = responseText.substring(maxLength);
            }

            await message.reply(`${responseText}`);
            conversations[userId] = messages;
            conversations[userId].push({ role: "assistant", content: responseText });
        }
        if (!responseText) {
            await message.reply("Sorry, I didn't understand that. Can you please rephrase your question?");
        }
        return;

    } catch (error) {
        console.log(error.toJSON())
        await message.reply('There was an error while processing your request. Please try again later.');
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log("ChatGPT Bot is online on Discord")