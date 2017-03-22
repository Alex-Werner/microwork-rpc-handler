const Microwork = require('microwork');
const winston = require('winston');
const provider = new Microwork({host:'/', exchange:'myExchange', loggingTransports:[new winston.transports.Console({level: 'error'})]});
const RPCHandler = require('../index');

const getResultFromQuery=function(query){
    return 42;
}
const handleMyTopic = async function (msg, reply, ack, nack, data) {
    if(msg){
        if(msg.hasOwnProperty('type')){
            let type = msg.type;
            if(type=='askForSomething' && msg.hasOwnProperty('query')){
                let query = msg.query;
                let result = getResultFromQuery(query);
                let response = {
                    data:{
                        result:result
                    }
                };
                //Will reply to the consumer the data : 42.
                RPCHandler.handleRPCReply(data, msg, response, reply, provider);
            };
        }
    }
}
const startProvider = async() => {
    console.log('Started providing stuff');
    await RPCHandler.subscribeToRPCEvents(provider);
    await provider.subscribe('myService.myTopic', handleMyTopic);
};
startProvider()