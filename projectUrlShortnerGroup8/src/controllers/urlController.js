const URLSchema = require("../models/urlSchema")
const validUrl = require('valid-url')
const shortid = require('shortid')
const urlSchema = require("../models/urlSchema")
const baseUrl = "http://localhost:3000"
const { promisify } = require("util"); // have to write in object mode
let redisClient = require("../configs/redis")



const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);




// ************************************************************  Create Short URL  ************************************************************

const ShortUrl = async function (req, res) {
    try {


        if (Object.keys(req.query).length > 0) return res.status(503).json(" Service unabilable. Please move on request body ")
        if (Object.keys(req.body).length <= 0) return res.status(400).json("Please provide URL data in request body")
        if (Object.keys(req.body).length > 1) return res.status(400).json("you can pass only one key in request body")


        const { longUrl } = req.body
        if (typeof longUrl !== 'string') return res.status(400).json("please provide 'longUrl' key in only string ")
        if (!longUrl || longUrl.trim().length <= 0) return res.status(400).json("please provide 'longUrl' key in request body")


        if (validUrl.isUri(longUrl)) {   // fail undefined pass same url
            try {


                let cahcedData = await GET_ASYNC(`${longUrl}`)
                if (cahcedData) {
                    cahcedData = JSON.parse(cahcedData)
                    console.log("cahcedData : ", cahcedData)
                    return res.status(200).send({ status: true, msg: "'provided url already exist in cahced record", Data: cahcedData })
                }


                let url = await URLSchema.findOne({ longUrl })
                if (url) {
                    console.log("databaseData", url)
                    await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
                    return res.status(200).json({ status: true, msg: 'Already generated short link. Try another link or you can use it. This is your result', result: url })
                }

                if (!validUrl.isUri(baseUrl)) return res.status(401).json('Invalid base URL')
                const urlCode = shortid.generate()   // 9 character unique code 
                let shortUrl = baseUrl + '/' + urlCode

                
                url = {
                    longUrl,
                    shortUrl,
                    urlCode
                }
                url = await URLSchema.create(url)
                if (url) return res.status(201).json({ status: true, msg: 'new short link generated. This is your result', result: url })
            }


            catch (err) {   // inner catch block 
                console.log(" inner try block error ", err)


                if (err.message.startsWith("Url validation failed")) {
                    const key = Object.keys(err['errors'])
                    for (let i = 0; i < key.length; i++) {
                        if (err['errors'][key[i]]['kind'] === "required")
                            return res.status(400).json(` '${key[i]}' field is required `)
                    }
                }


                if (err.message.includes("duplicate key error")) {
                    const key = Object.keys(err)
                    for (let i = 0; i < key.length; i++) {
                        if (err['index'] === 0)
                            return res.status(400).json({ "key": err['keyValue'], "msg": `This key should be unique ` })
                    }
                }


                if (err) return res.status(500).json({ msg: "error occure in inner try block. For more information move to console ", error: err.message })
            }
        }


        else return res.status(401).json('Invalid longUrl')
    }


    catch (err) {  // outer catch block
        console.log("outer try block error", err)
        return res.status(500).json({ msg: "error occure in outer try block. For more information move to console ", error: err.message })
    }
}




const isValid = function (value) {
    if (value === 'undefined' || value === 'null' || value === '"' || value === '""') return false
    if ((typeof value === 'string' && value.trim().length === 0)) return false
    if ((value.startsWith('"') && value.endsWith('"')) || value.startsWith('"') || value.endsWith('"') || value.startsWith(' ') || value.endsWith(' ')) {
        let flag = 0
        for (let i = 0; i < value.length; i++)
            if (value[i] === " ")
                flag++
        if (flag === value.length - 2) return false
    }
    if(value.length>9 || value.length<9) return false
    return true
}




// ******************************************************** redirect from short URL to long URL ************************************************************



const redirectUrl = async function (req, res) {
    try {

        if (Object.keys(req.query).length > 0) return res.status(503).json(" Service unabilable.")
        if (Object.keys(req.body).length > 0) return res.status(503).json(" Service unabilable.")
        if (!req.params.urlCode) return res.status(400).json("No 'urlCode' found in param")   // no need to test
        if (!isValid(req.params.urlCode)) return res.status(400).json("please enter valid url code 9 character")

        let cahcedData = await GET_ASYNC(`${req.params.urlCode}`)

        if (cahcedData) {
            cahcedData = JSON.parse(cahcedData);
            console.log("cahcedData : ", cahcedData)
            return res.status(302).redirect(cahcedData)

        }
        let databaseData = await urlSchema.findOne({ urlCode: req.params.urlCode });
        console.log("databaseData : ", databaseData)
        if (!databaseData) return res.status(404).json("No data found")
        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(databaseData.longUrl))
        return res.status(302).redirect(databaseData.longUrl)


    }
    catch (err) {
        console.error(err)
        return res.status(500).json({ msg: "error occure. For more information move to console ", error: err.message })
    }
}





module.exports = {
    ShortUrl,
    redirectUrl
}

