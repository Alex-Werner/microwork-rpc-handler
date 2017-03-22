const Microwork = require('microwork');
const winston = require('winston');
const provider = new Microwork({host:'/', exchange:'myExchange', loggingTransports:[new winston.transports.Console({level: 'error'})]});
const RPCHandler = require('../index');

function consumeSomething(query) {
    return new Promise(async function (resolve, reject) {
        let data = {
            type: 'askForSomething',
            query: query
        };
        //Generate a unique rpcId, and prepare himself to receive an event (using emitter.once)
        //will also sanitize the data.
        //When it will receive a response from the provider service, it will resolve the promise using receided data
        data = RPCHandler.prepareRPCRequest(data, resolve, reject);
        //Send to the desired topic, the data using the service.id as a correlationId.
        await RPCHandler.handleRPCRequest('myService.myTopic', data, provider);
    });
};
function consumeSomethingThatDoesNotExist(query) {
    return new Promise(async function (resolve, reject) {
        let data = {
            type: 'askForSomethingInexistant',
            query: query
        };
        //Generate a unique rpcId, and prepare himself to receive an event (using emitter.once)
        //will also sanitize the data.
        //When it will receive a response from the provider service, it will resolve the promise using receided data
        data = RPCHandler.prepareRPCRequest(data, resolve, reject,1000);
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

    async function startSync(){
        let res2 = await consumeSomethingThatDoesNotExist({isLogged:true});
        console.log('result2 is', res2);

        let res1 = await consumeSomething({isLogged:true});
        console.log('result1 is', res1);
    }
    function startAsync(){
        consumeSomethingThatDoesNotExist({isLogged:true}).then(function(result){
            console.log('result2 is', result);
        });

        let res = consumeSomething({isLogged:true}).then(function(result){
            console.log('result is', result);
        });
    }
    await startSync();
    startAsync();

};
startConsumer();