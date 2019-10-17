const TelegramBot = require('node-telegram-bot-api');
const token = '760978574:AAGPNOfbFeo7X07I2MFJ8s02kiurNmisQUM';
const bot = new TelegramBot(token, {polling: true});
const groupId = '-351595481';
const parcer = require('node-html-parser');
const axois = require('axios');

const firebase = require("firebase");
firebase.initializeApp({
    serviceAccount: "./serviceAccount.json",
    databaseURL: 'https://rent-manager-bot.firebaseio.com/'
});

const targetAddress = 'Берсеневская Набережная 4 ст3';
const maxPrice = 40000;

const URL = `https://www.avito.ru/moskva/kvartiry/sdam/na_dlitelnyy_srok?cd=1&pmax=${maxPrice}&pmin=0&user=1&s=104`;

setTimeout(syncOffers, 2, 60 * 60 * 1000);

bot.onText(/\/echo/, msg => {
    bot.sendMessage(msg.chat.id, msg.chat.id);
});

function syncOffers() {
    firebase.database().ref("offersIdArray").once("value", function (snapshot) {
        const offersIdArray = snapshot.val() || [];
        axois.get(URL).then(res => {
            const root = parcer.parse(res.data);
            const data = (root).querySelectorAll('.item__line');
            const result = data.map(home => {
                const
                    descriptionNode = home.querySelector('.item-description-title-link'),
                    priceNode = home.querySelector('.price'),
                    addressNode = home.querySelector('.item-address__string');
                let link, title, price, address, route;

                descriptionNode.rawAttrs.split('\n').forEach((val) => {
                    let match;
                    if ((match = val.match(/href="(.+)"/)) != null) link = `https://www.avito.ru${match[1]}`;
                    if ((match = val.match(/title="(.+)"/)) != null) title = match[1]
                });
                const id = link.slice(-10)
                if (offersIdArray.includes(id)) return null;

                price = priceNode.childNodes[0].rawText.replace('\n', '');
                address = addressNode.childNodes[0].rawText.replace('\n', '');
                route = (`https://www.google.ae/maps/dir/${address}/${targetAddress}`)
                    .replace(/ /g, '%20').replace(/,/g, '%2C');

                return {id, link, title, price, address, route}
            }).filter(val => val != null).map(({id, link, title, price, address, route}) => {
                bot.sendMessage(groupId, `${title}: ${price} Рублей в месяц\nАдрес: ${address}`, {
                    reply_markup: {
                        inline_keyboard: [[{text: 'Ссылка на авито', url: link}], [{text: 'Маршрут', url: route}]]
                    }
                });
                return id
            });

            firebase.database().ref('/').update({offersIdArray: offersIdArray.concat(result)})
        })
    })
}


