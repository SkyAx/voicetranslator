const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const say = require('say');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const conf = require('./config/config');

const bot = new TelegramBot(conf.telegramApiKey, {polling: true});

bot.onText(/\/start/, function onPhotoText(msg) {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ['Translate'],
                ['Weather'],
                ['Variable']
            ],
            'one_time_keyboard': true,
            'parse_mode': true
        })
    };
    bot.sendMessage(chatId,`Hello, i’am Voicer bot. \n\nI can translate, say you about weather in required city and make variables 😅. \n
     \n Use buttons to send me a command`, opts);
});

bot.onText(/Translate/i, function onPhotoText(msg) {
    const chatId = msg.chat.id;
    console.log(msg.text);
    translation(msg.text, chatId);
});

bot.onText(/Weather/i, function onPhotoText(msg) {
    const chatId = msg.chat.id;
    let city = 'Minsk';

    http.get(`https://openweathermap.org/data/2.5/weather?q=${city}&appid=${conf.weatherApiKey}`, (res) => {
        res.setEncoding("utf8");
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            let data = JSON.parse(body);
            console.log(data);
            for(let i of data) {
                bot.sendMessage(chatId, data);
            }
        });
    });
});

bot.onText(/Variable/i, function onPhotoText(msg) {
    const chatId = msg.chat.id;
    translation(message, chatId, true);
});

function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {
            console.log('conversion ended');
            callback(null);
        }).on('error', function(err){
        console.log('error: ', err.code, err.msg);
        callback(err);
    }).run();
}

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
