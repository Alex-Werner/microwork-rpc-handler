const EE2 = require('eventemitter2').EventEmitter2;
const emitter = new EE2();
const {clone,uuid} = require('khal');

const sanitize = function (data) {
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        let v = data[keys[i]];
        let k = keys[i];

        if (v) {
            if (v.constructor.name == "Object") {
                data[keys[i]] = JSON.stringify(v);
            }
        }
    }
    return data;
};
const RPCHandler = {
    handleRPCReply: function (data, msg, response, reply, provider) {
        if (msg.hasOwnProperty('_rpcId')) {
            response._rpcId = msg._rpcId;
            response._sender = provider.id
        }
        if (data
            && data.hasOwnProperty('properties')
            && data.properties.hasOwnProperty('correlationId')
            && data.properties.correlationId != undefined
        ) {
            reply(data.properties.correlationId, response);
        }
    },
    handleRPCRequest: async function (topic, data, service) {
        await service.send(topic, sanitize(data), {correlationId: service.id});
    },
    prepareRPCRequest: function (data, resolve, reject, timeout=-1) {
        let _rpcId = uuid.generate.v4();

        let listener = (data) => {
            resolve(data);
        };
        emitter.once(_rpcId,listener);
        if(timeout && timeout.constructor.name=="Number" && timeout>0){
            setTimeout(function () {
                emitter.removeListener(_rpcId,listener);
                resolve({error:'timeout',time:+new Date(), timeout:timeout});
            },timeout);
        }
        data._rpcId = _rpcId;
        return sanitize(data);
    },
    subscribeToRPCEvents: async function (service) {
        await service.subscribe(service.id, (msg, reply, ack, nack, data) => {
            if (msg && msg.hasOwnProperty('_rpcId')){
                if(msg.hasOwnProperty('data')) {
                    emitter.emit(msg._rpcId, msg.data);
                }else{
                    let _data = clone(msg);
                    delete _data['_rpcId'];
                    emitter.emit(msg._rpcId, _data);
                }
            }
        });
    }
};
module.exports = RPCHandler;