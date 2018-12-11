const WebSocket = require('ws');

const currentConnect = [] ; 

const hasConnected = {} ;

let hasAward = [] 

const WsServe = new WebSocket.Server({
  port: 3000,
});

var timer = null ; 

const strategy =  {
    "save" : function( data ){
        if(data && data.name){
            if( hasConnected[data.name]){
                console.log("current user has connected") ;
            }else{
                hasConnected[data.name] = true ; 
                data.count = 0 ;
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
        ws.send(JSON.stringify({"action" : "getAward" , "data" : hasAward }));
    } ,
    "shake" : function(data ,ws ){
        var name = data.name ; 

        currentConnect.forEach( item => {
            if(item.name === name )
                item.count += 100 ; 
        });

        console.log(currentConnect)
    } , 
    getRank : function( data , ws){
        currentConnect.sort(ObjSort("count")) ; 

        ws.send(JSON.stringify({'action' : 'getRank' , "data" : currentConnect })) ;
    } , 
    start : function( data , ws ){

        var time = data.time  ; 

        var award = data.award ;
        
        if(timer)
            return ;

        timer = setInterval( () => {

            time -- ; 

            let data = currentConnect.sort(ObjSort("count")).slice( 0 , award )
            if( time === 1 ){
                clearInterval(timer) ;

                timer = null ; 

                hasAward = hasAward.concat( data ) ;

                WsServe.clients.forEach( ( client ) => {
                    client.send(JSON.stringify({action : 'end' , data : data }))
                });

            }else{
                WsServe.clients.forEach( ( client ) => {
                    client.send(JSON.stringify({action : 'start' ,data : data , time : time }))
                });

            };
        } , 1000 ) ;
    }
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

var ObjSort = function(pro) { 
    return function (obj1, obj2) { 
        var val1 = obj1[pro]; 
        var val2 = obj2[pro]; 
        if (val1 < val2 ) { 
            return 1; 
        } else if (val1 > val2 ) { 
            return -1; 
        } else { 
            return 0; 
        } 
    } 
};