const express = require("express")
const router = express.Router()
const urlController = require("../controllers/urlController")




router.get("/test-me", function (req , res){
    res.status(200).send("first api")
})



router.post("/url/shorten" , urlController.ShortUrl)



router.get("/:urlCode",urlController.redirectUrl)


module.exports = router