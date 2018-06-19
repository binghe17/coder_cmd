
const http = require('http');
const express = require('express');
const SocketIO=require('socket.io');
const child_process = require('child_process');
var child = child_process.fork('./child_cmd.js');//处理cmd任务的子进程


let app = express();
app.use(express.static('.'));// 静态本目录

let httpServer = http.createServer(app);
httpServer.listen(80,()=>{console.log('lesten localhost:80\nopen page  http://localhost')});

let io=SocketIO();// Server
let opt={
	pingInterval:60000,// 超过该毫秒的ping pong间隔则考虑关闭连接(60000)
	pingTimeout:25000,// 发送新的ping数据包间隔(25000)
	// transports:['polling','websocket'],// 允许连接的类型
	cookie:false
};
io.attach(httpServer, opt);


io.on('connect',function(s){

	s.send('<<< 与服务器连接成功 [connect: '+ s.id+']\n');
	s.send('='.repeat(50)+'\n');
	console.log('[connect]', s.id);


	var isNotOning = true;
	function stap1(){//侦听函数
			child.on('message', function(msg){//监听子进程发来的消息。
				// console.log('[main]', process.pid, '我是主进程')
				console.log(msg)
				if(msg.status=='ok') s.send(msg.data);
				else if(msg.status == 'error'){
					s.send('------与cmd的通信出错----\n');
				}else if(msg.status == 'close'){
					 // s.send('------断开了与cmd的通信----\n\n')
					 s.send({sendOK: 'yes'})
					 s.send('='.repeat(50)+'\n');
				}else if(msg.status == 'catch'){
					s.send('[!!!!catch error]执行cmd命令时出错：'+msg.data+'\n\n')
				}
			});
	}

	s.on('message',function(msg){
		
		if(msg =='[!!stop]'){//强制终止

			child.kill()
			s.send('[main] 强制关闭子进程 '+ child.pid+'\n')
			child = child_process.fork('./child_cmd.js');//处理cmd任务的子进程
			s.send('[main] 新开启了子进程 '+ child.pid+'\n')
			stap1()


		}else{//执行命令

			// console.log(isNotOning+'----------'+msg)
			child.send(msg);//给子进程发送消息
			if(isNotOning){//防止多次监听
				stap1()
				isNotOning = false;
			}
			
		}
	});

	s.on('close',function(reason){
		s.send('[close]'+ s.id +'-----'+ reason+'\n');
	});
	s.on('error', function(err){
		s.send('[error]'+ s.id +'-----'+ err +'\n');
	})
});




