const WebSocket = require('ws');

const currentConnect = [] ; 

const hasConnected = {} ;

let hasAward = [] 

const WsServe = new WebSocket.Server({
  port: 3000,
});

var timer = null ; 

var state = 'wait' ; 

const strategy =  {
    "save" : function( data ){
        if(data && data.id){
            if( hasConnected[data.id]){
                console.log("current user has connected") ;
            }else{ 
                hasConnected[data.id] = true ; 
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

        if(state === 'wait')
            return ;

        var id = data.id ; 

        currentConnect.forEach( item => {
            if(item.id === id )
                item.count += 100 ; 
        });
    } , 
    getRank : function( data , ws){
        currentConnect.sort(ObjSort("count")) ; 

        ws.send(JSON.stringify({'action' : 'getRank' , "data" : currentConnect })) ;
    } , 
    start : function( data , ws ){

        var time = data.time  ; 

        var award = data.award ;

        currentConnect.forEach( item => {
            item.count = 0 ;
        });


        state = 'start' ; 

        if(timer)
            return ;

        timer = setInterval( () => {

            time -- ; 

            let data = currentConnect.sort(ObjSort("count")).slice( 0 , award )
            if( time === -1 ){
                clearInterval(timer) ;

                timer = null ; 

                hasAward = hasAward.concat( data ) ;

                state = 'wait' ; 

                WsServe.clients.forEach( ( client ) => {
                    client.send(JSON.stringify({action : 'end' , data : data }))
                });

                hasAward = currentConnect.splice(0 , 10 ) ;
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