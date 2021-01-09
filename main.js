// require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot("1437222649:AAFQ89PJuXYHjK8IVQ4n2otWEZMS_DxYC7M", {polling: true});
// const bot = new TelegramBot(process.env.TOKEN, {webHook: {port: +process.env.PORT}})
// bot.setWebHook(`${process.env.URL}/bot${process.env.TOKEN}`).catch(e => console.error(e));
const groupId = '-490363061';
const parcer = require('node-html-parser');
const axois = require('axios');

const firebase = require("firebase");
firebase.initializeApp({
    serviceAccount: "./serviceAccount.json",
    databaseURL: 'https://astrobot-26975.firebaseio.com/'
});


const URL = `https://www.avito.ru/rossiya/odezhda_obuv_aksessuary/kupit-aksessuary-ASgBAgICAUTeAtoL?q=%D1%81%D1%83%D0%BC%D0%BA%D0%B0+Chanel+%D0%BE%D1%80%D0%B8%D0%B3%D0%B8%D0%BD%D0%B0%D0%BB&s=104`;

setInterval(syncOffers, 30 * 1000);

bot.onText(/\/echo/, msg => {
    bot.sendMessage(msg.chat.id, msg.chat.id);
});

async function syncOffers() {
    await firebase.database().ref("offersIdArray").once("value", async function (snapshot) {
        const offersIdArray = snapshot.val() || [];
        const res = await axois.get(URL)
        const root = parcer.parse(res.data);
        const data = root.querySelectorAll('.js-catalog-item-enum');
        const parsedParams = data.map(home => {
            try {
                const id = home.id
                const href = home.firstChild.childNodes[0].lastChild.rawAttrs.match(/href="(.+?)"/)[1]
                const link = 'https://www.avito.ru' + href
                const title = home.firstChild.childNodes[1].childNodes[0].firstChild.firstChild.text
                const price = home.firstChild.childNodes[1].childNodes[1].firstChild.firstChild.lastChild.text
                return {id, link, title, price}
            } catch (e) {
                console.error(e)
                return null
            }
        }).filter(v =>
            v !== null
            && (v.title.split(' ').includes('chanel') || v.title.split(' ').includes('Chanel'))
            && !offersIdArray.includes(v.id)
        )
        const result = []
        for (let i in parsedParams) {
            try {
                const {id, link, title, price} = parsedParams[i]
                await bot.sendMessage(groupId, `${title}: ${price}`, {
                    reply_markup: {
                        inline_keyboard: [[{text: 'Ссылка на авито', url: link}]]
                    }
                });
                await new Promise(r => (setTimeout(r, 1000)))
                result.push(id)
            } catch (e) {
                console.error(e)
            }
        }
        await firebase.database().ref('/')
            .update({offersIdArray: offersIdArray.concat(result)})
        console.log(result)
    })
}


console.log('bot was started')
