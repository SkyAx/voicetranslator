const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const say = require('say');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const token = '931046005:AAFAZ10TKmHcYpVfmMl2nVXViHOCYJIEK4I';

let file = fs.readFileSync('./voices/voice.mp3');

const bot = new TelegramBot(token, {polling: true});

function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {
            console.log('conversion ended');
            callback(null);
        }).on('error', function(err){
        console.log('error: ', e.code, e.msg);
        callback(err);
    }).run();
}

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    translate(msg.text, {to: 'en'}).then(res => {
        console.log(`${msg.chat.first_name} ${msg.chat.last_name || ''}`);
        console.log(msg.text);


        say.export(res.text, 'Samantha', 1, './voices/voice.wav', function(err) {
            if (err) {
                return console.error(err);
            }


            convert('./voices/voice.wav', './voices/voice.mp3', function(err){
                if(!err) {
                    console.log(file);
                    bot.sendMessage(chatId, res.text);
                    bot.sendVoice(chatId, file);
                }
            });
        });
    }).catch(err => {
        console.error(err);
    });
});
