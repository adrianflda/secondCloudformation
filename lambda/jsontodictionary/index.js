const AWS = require('aws-sdk');

exports.jsontodictionary_function = async (event, context, callback) => {
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

    // Match js type
    var fileType = typeMatch[1].toLowerCase();
    if (fileType !== "json") {
        callback(`Unsupported type: ${fileType}`);
        return;
    }

    let response = await s3getCSV(srcBucket, srcKey).catch(e => console.log(e));
    if (!response) {
        callback('Not response');
        return;
    }
    let json = JSON.parse(response.Body.toString())
    //process de json file 
    json = await processJSON(json).catch(e => console.log(e))
    if (!json) {
        callback(null, 'Not JSON')
        return
    }

    //put json file into dictionary if age over 18
    let initial = json && json.LName && json.LName.substring(0, 1) || '_'
    let dstKey = `dictionary/${initial}/${json.LName}-${json.ID}.json`
    await s3putJSON(json, srcBucket, dstKey).catch(e => console.log(e))
    if (!dstKey) {
        callback('Can not put object')
        return
    }

    let task = `processed ${srcBucket}/${dstKey}`
    
    callback(null, task)
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

const processJSON = json => {
    return new Promise((resolve, reject) => {
        if (!json) {
            reject('JSON is undefined')
            return
        }

        let dob = new Date(json.DOB)
        let today = new Date()
        let over18 = (today.getFullYear() - dob.getFullYear() > 18) ||
            (today.getFullYear() - dob.getFullYear() === 18 &&
                today.getMonth() <= dob.getMonth() &&
                today.getDate() <= dob.getDate())

        over18 ? resolve(json) : reject('Not age over 18')
    })
}