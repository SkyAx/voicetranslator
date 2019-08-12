const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const say = require('say');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const conf = require('./config/config');


const bot = new TelegramBot(conf.key, {polling: true});

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
    let message = msg.text;

    translation(message, chatId, isVarMessage(message));
    console.log(`${msg.chat.first_name} ${msg.chat.last_name || ''}`);
    console.log(msg.text);
});

function translation(msg, chatId, isVar = false, lang =  'en') {

    translate(msg, {to: lang}).then(res => {
        let resText = res.text;

        if(isVar) {
            resText = resText.replace('var:', '').trim().replace(/\s/g, '_');
        } else {
            sayIt(resText, chatId);
        }

        bot.sendMessage(chatId, resText);

    }).catch(err => {
        console.error(err);
    });
}

function sayIt(msg, chatId) {
    say.export(msg, 'Samantha', 1, './voices/voice.wav', function(err) {
        if (err) {
            return console.error(err);
        }

        convert('./voices/voice.wav', './voices/voice.mp3', function(err){
            if(!err) {
                let file = fs.readFileSync('./voices/voice.mp3');

                bot.sendVoice(chatId, file);
            }
        });
    });
}


function isVarMessage(msg) {
    return msg.indexOf('var:') !== -1;
}
