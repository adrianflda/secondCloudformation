const AWS = require('aws-sdk');
const csv = require("csvtojson");

exports.csvtojson_function = async (event, context, callback) => {
    if (!event.Records) {
        callback('Error: Event has no records.')
        return
    }
    // Read options from the event.
    const srcBucket = event.Records[0].s3.bucket.name;

    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    // Infer the type.
    var typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        callback("Could not determine the file type.");
        return;
    }

    // Match csv type
    var fileType = typeMatch[1].toLowerCase();
    if (fileType !== "csv") {
        callback(`Unsupported type: ${fileType}`);
        return;
    }

    let response = await s3getCSV(srcBucket, srcKey).catch(e => console.log(e));
    if (!response) {
        callback('Not response');
        return;
    }
    let fileToString = response.Body.toString();
    let finish = await convertCSVToJSON(fileToString, srcBucket).catch(e => console.log(e));

    callback(null, finish);
};

const s3getCSV = (srcBucket, srcKey) => {
    // Download the image from S3 into a buffer.
    // let conf = settings()
    const s3 = new AWS.S3();
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };

    return new Promise((resolve, reject) => {
        s3.getObject(params, (err, response) => {
            if (err) {
                reject(err)
                return
            }
            resolve(response)
        })
    })
};

const s3putJSON = (json, dstBucket, dstKey) => {
    // Stream the transformed image to a different S3 bucket.
    return new Promise((resolve, reject) => {
        if (!json) {
            reject('JSON is undefined')
            return
        }
        const s3 = new AWS.S3()
        let params = {
            Bucket: dstBucket,
            Key: dstKey,
            Body: JSON.stringify(json),
            ContentType: "application/json",
            ServerSideEncryption: 'AES256'
        }
        s3.putObject(params, (err, result) => {
            if (err) {
                reject(err)
                return
            }
            resolve(dstKey)
        });
    })
};

const convertCSVToJSON = (fileString, dstBucket) => {
    console.log('convertCSVToJSON')
    // Covert csv file into JSON { ID, FName, LName, DOB }
    const dateOfBirthday = (item, head, resultRow, row, colIdx) => new Date(item);

    const toString = (item, head, resultRow, row, colIdx) => item.replace(/"/g, "").trim()

    return new Promise((resolve, reject) => {
        if (!fileString) {
            reject('FileString is undefined')
            return
        }

        let converter = csv({
            colParser: {
                "ID": toString,
                "FName": toString,
                "LName": toString,
                "DOB": dateOfBirthday
            }
        })

        converter
            .fromString(fileString)
            .then(jsonArray => {
                jsonArray = (jsonArray && jsonArray.length) ? jsonArray : []
                var index = 0
                jsonArray.forEach(async json => {
                    let dstKey = `json/${json.LName}-${json.ID}.json`
                    await s3putJSON(json, dstBucket, dstKey)
                    console.log(index++);

                    if (index >= jsonArray.length - 1)
                        resolve(true)
                })
            })
    })
}