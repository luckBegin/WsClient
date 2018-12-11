const WebSocket = require('ws');

const currentConnect = [] ; 

const hasConnected = {} ;

const hasAward = {} ;

const WsServe = new WebSocket.Server({
  port: 3000,
});


const strategy =  {
    "save" : function( data ){
        if(data && data.name){
            if( hasConnected[data.name]){
                console.log("current user has connected") ;
            }else{
                hasConnected[data.name] = true ; 

                currentConnect.push(data) ;

                console.log("current length is :" + currentConnect.length ) ;
            };
        };
    } , 
    "getAll" : function( data , ws ){
        const list = {
            all : currentConnect , 
            hasAward : hasAward
        } ;
        ws.send(JSON.stringify({"action" : "getAll" , "data" : list }));
    } ,
    "award" : function( data , ws) {
        console.log(data) ;
        if(data instanceof Array){
            data.forEach( item => {
                if(item.name)
                    hasAward[item.name] = true ;
            })
        };

        if(data && data.name){
            hasAward[data.name] = true ;
        }
    },
    "getAward" : function( data , ws ){
        const list = {
            hasAward : hasAward
        } ;
        ws.send(JSON.stringify({"action" : "getAward" , "data" : list }));
    } ,
} ; 
WsServe.on("connection" , con => {

    console.log("A client has been contected") ;
    
    con.on("message" , message => {
        try{
            const msg = JSON.parse(message) ; 
            if(msg.type){
                if(strategy[msg.type]){
                    strategy[msg.type].call(this , msg.info , con) ;
                }else{
                    console.log("the method is not exist") ;
                };
            }else{
                console.log("invalid message type") ;
            };
        }catch(e){
            console.log(e) ;
            console.log("message can't be convert to object ") ;
        };
    });

    con.on("close" , client => {
        console.log(client) ;
    });
});

