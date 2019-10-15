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

setTimeout(syncOffers, 2,60 *60 * 1000);

function syncOffers() {
    const reducer = (accumulator, currentValue) => ({...accumulator, [currentValue.link.slice(-10)]: currentValue});

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
            price = priceNode.childNodes[0].rawText.replace('\n', '');
            address = addressNode.childNodes[0].rawText.replace('\n', '');
            route = (`https://2gis.ru/moscow/routeSearch/from/${address}/to/${targetAddress}`)
                .replace(/ /g, '%20').replace(/,/g, '%2C');
            return {link, title, price, address, route}
        }).reduce(reducer, {})
        firebase.database().ref("offers").update(result)
    })
}


