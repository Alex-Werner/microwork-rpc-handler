# microwork-rpc-handler

A little handler that allow to send RPC with [microwork](https://github.com/yamalight/microwork) package

Install : `npm install microwork-rpc-handler -S`

Current : v 1.0.1 - see [CHANGELOG](https://github.com/Alex-Werner/microwork-rpc-handler/blob/master/CHANGELOG.md)


# API

- `handleRPCReply(data, msg, response, reply, provider)` - Allow to reply to a given request.
- async `handleRPCRequest(topic, data, service)` - Send the request
- `prepareRPCRequest(data, resolve, reject, [timeout])` - Should be used before a RPCRequest. Allow to prepare the reception of the RPCCalls, and handle resolving of the promise. If provided, a timeout can be executed which will remove the event listener
- async `subscribeToRPCEvents(service)` - Should be executed before everything : Allow to enable the reception and dispatching of future RPC Calls


### Usage exemple

We will assume in this exemple that we use microwork and winston.

I can only suggest you to see the working example is the [example folder](https://github.com/Alex-Werner/microwork-rpc-handler/blob/master/example)

Consumer.js
```
const Microwork = require('microwork');
const winston = require('winston');
const provider = new Microwork({host:'/', exchange:'myExchange', loggingTransports:[new winston.transports.Console({level: 'error'})]});
const RPCHandler = require('microwork-rpc-handler');

function consumeSomething(query){
    return new Promise(async function (resolve, reject) {
        let data = {
                type:'askForSomething',
                query:query
        };
        //Generate a unique rpcId, and prepare himself to receive an event (using emitter.once)
        //will also sanitize the data.
        //When it will receive a response from the provider service, it will resolve the promise using receided data
        data = RPCHandler.prepareRPCRequest(data, resolve, reject);
        //Send to the desired topic, the data using the service.id as a correlationId.
        await RPCHandler.handleRPCRequest('myService.myTopic', data, provider);
    });
};
const startConsumer = async() => {
    //Subscribe to event on the topic being the service id.
    //When it will received something, it will check if the data received has a _rpcId, and a data field.
    //If so, it will emit an event with theses information.
    //Note : If no data field in the received message, it will then emit with all msg (_rpcId excluded )
    await RPCHandler.subscribeToRPCEvents(provider);
    console.log('Consumer started..');
};
startConsumer();
```

provider.js
```
const Microwork = require('microwork');
const winston = require('winston');
const provider = new Microwork({host:'/', exchange:'myExchange', loggingTransports:[new winston.transports.Console({level: 'error'})]});
const RPCHandler = require('microwork-rpc-handler');

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
```

# Contributions

Every idea, issue, PR, contributions or anything else is welcomed :)

# LICENSE

[MIT](https://github.com/Alex-Werner/microwork-rpc-handler/blob/master/LICENSE)