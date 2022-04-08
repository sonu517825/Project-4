const redis = require("redis")




//  redis-13124.c212.ap-south-1-1.ec2.cloud.redislabs.com:13124   sonu verma
//  7dt27hqDd4B9iQFsDpiu7m27G4cLo4sA




const client = redis.createClient({
    port: 13124,
    host: "redis-13124.c212.ap-south-1-1.ec2.cloud.redislabs.com",
})




client.auth("7dt27hqDd4B9iQFsDpiu7m27G4cLo4sA", function (err) {
    if (err) throw err;   // only use throw err success response generate exception
});




client.on("connect", (pass) => {    // no need to write event
    console.log("connecting to redis........")
})      



client.on("ready", () => {
    console.log("client connected to redis successfull. Now you can use it....")
})



client.on("error", (err) => {   // have to write event
    console.log(err.message)
})



client.on("end", () => {
    console.log("client disconnected from redis....")
})



process.on("SIGINT", () => {
    client.quit()
})


module.exports = client



