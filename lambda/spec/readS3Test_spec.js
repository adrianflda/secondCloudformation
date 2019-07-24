'use strict';

const LambdaTester = require('lambda-tester');

const csvtojson = require('../../lambda/csvtojson/index.js');
const jsontodictionary = require('../../lambda/jsontodictionary/index.js');

describe('read aws s3', () => {
    return LambdaTester(csvtojson.csvtojson_function)
        .event({ Records: [{ s3: { object: { key: "csv/file.csv" }, bucket: { name: 'input-bucket-for-task' } } }] })
        .expectResult((err, result) => {
            console.log(err, result);
        }).catch(e => console.log(e))
})

describe('read aws s3', () => {
    return LambdaTester(jsontodictionary.jsontodictionary_function)
        .event({ Records: [{ s3: { object: { key: "json/hernandez-2.json" }, bucket: { name: 'input-bucket-for-task' } } }] })
        .expectResult((err, result) => {
            console.log(err, result);
        }).catch(e => console.log(e))
})
