const https = require('https');

const getRequest = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, res => {
            let rawData = '';

            res.on('data', chunk => {
                rawData += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(rawData));
                } catch (err) {
                    reject(new Error(err));
                }
            });
        });

        req.on('error', err => {
            reject(new Error(err));
        });
    });
}

let cachedResponse;

exports.handler = async (event, context, callback) => {
    if (!cachedResponse) { // cold start of the lambda function
        console.log('retrieve data from arcgis');

        const endpoint = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,%20-1)&returnGeometry=false&geometry=42.000,12.000&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&outFields=*&outStatistics=%5B%7B"statisticType":"sum","onStatisticField":"AnzahlFall","outStatisticFieldName":"cases"%7D,%20%7B"statisticType":"max","onStatisticField":"MeldeDatum","outStatisticFieldName":"date"%7D%5D&resultType=standard&cacheHint=true';
        const json = await getRequest(endpoint);

        const cases = json.features[0].attributes.cases;
        const perHour = cases / 24;
        const perMinute = perHour / 60;
        const perSecond = perMinute / 60;
        const interval = (1 / perSecond).toFixed(2);

        const timestamp = json.features[0].attributes.date;
        const currentDay = Date.now();
        const differenceDays = (currentDay - timestamp) / (1000 * 60 * 60 * 24);

        let dateString;

        if (differenceDays < 1) {
            dateString = "heute";
        } else if (differenceDays < 2) {
            dateString = "gestern";
        } else {
            dateString = `vor ${Math.floor(differenceDays)} Tagen`;
        }

        cachedResponse = {
            statusCode: 200, body: JSON.stringify({
                counter: `Alle ${interval} Sekunden`,
                updated: `Aktualisiert ${dateString}`
            }),
        };
    } else {
        console.log('serve cached response');
    }


    return cachedResponse;
}